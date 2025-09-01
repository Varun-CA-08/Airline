// routes/baggage.js
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { authRequired } from "../middleware/auth.js";
import Baggage from "../models/Baggage.js";
import Flight from "../models/flight.js";
import { producer } from "../config/kafka.js";
import { redis } from "../config/redis.js";
import mongoose from "mongoose";

const router = Router();

/**
 * CREATE baggage
 */
router.post(
  "/",
  authRequired(["admin", "baggage", "airline"]),
  [
    body("tagId")
      .notEmpty()
      .withMessage("Tag ID is required")
      .isAlphanumeric()
      .withMessage("Tag ID must be alphanumeric")
      .trim()
      .escape(),
    body("flightId")
      .notEmpty()
      .withMessage("Flight ID is required")
      .isMongoId()
      .withMessage("Invalid Flight ID")
      .custom(async (value) => {
        const flight = await Flight.findById(value);
        if (!flight) throw new Error("Flight not found");
        return true;
      }),
    body("weight")
      .optional()
      .isFloat({ min: 0.1, max: 100 })
      .withMessage("Weight must be between 0.1–100 kg"),
    body("status")
      .optional()
      .isIn(["checkin", "loaded", "inTransit", "unloaded", "atBelt", "lost"])
      .withMessage("Invalid status"),
    body("lastLocation").optional().trim().escape(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const baggageData = {
        ...req.body,
        createdBy: req.user.sub,
      };

      const baggage = await Baggage.create(baggageData);

      // Publish Kafka event
      await producer.send({
        topic: "baggage-events",
        messages: [
          {
            key: baggage.tagId,
            value: JSON.stringify({
              type: "baggage",
              subtype: "created",
              baggageId: baggage._id,
              tagId: baggage.tagId,
              flightId: baggage.flightId,
              status: baggage.status,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      // Cache baggage status
      await redis.set(
        `baggage:${baggage.tagId}`,
        JSON.stringify({
          flightId: baggage.flightId,
          status: baggage.status,
          lastLocation: baggage.lastLocation,
          updatedAt: baggage.updatedAt,
        }),
        { EX: 7200 } // TTL = 2 hours
      );

      res.status(201).json({
        message: "Baggage successfully assigned to flight",
        baggageId: baggage._id,
        tagId: baggage.tagId,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Baggage tag ID already exists" });
      }
      next(err);
    }
  }
);

/**
 * UPDATE baggage (by _id or tagId)
 */
router.patch(
  "/:idOrTag",
  authRequired(["admin", "baggage"]),
  [
    body("status")
      .optional()
      .customSanitizer((value) => value?.toLowerCase().replace(/\s+/g, ""))
      .isIn(["checkin", "loaded", "inTransit", "unloaded", "atBelt", "lost"])
      .withMessage("Invalid status"),
    body("lastLocation").optional().trim().escape(),
    body("flightNo").optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { idOrTag } = req.params;
      const updates = { ...req.body };

      // Protect immutable fields
      ["tagId", "flightId", "createdBy", "_id"].forEach(
        (field) => delete updates[field]
      );

      // Resolve flightNo → flightId
      if (req.body.flightNo) {
        const flight = await Flight.findOne({ flightNo: req.body.flightNo });
        if (!flight) {
          return res
            .status(404)
            .json({ error: `Flight ${req.body.flightNo} not found` });
        }
        updates.flightId = flight._id;
      }

      // Build query: check if idOrTag is a valid ObjectId
      let query;
      if (mongoose.Types.ObjectId.isValid(idOrTag)) {
        query = { _id: idOrTag };
      } else {
        query = { tagId: idOrTag };
      }

      // Update baggage
      const baggage = await Baggage.findOneAndUpdate(query, updates, {
        new: true,
        runValidators: true,
      });

      if (!baggage) {
        return res.status(404).json({ error: "Baggage not found" });
      }

      // Publish Kafka update event
      await producer.send({
        topic: "baggage-events",
        messages: [
          {
            key: baggage.tagId,
            value: JSON.stringify({
              type: "baggage",
              subtype: "updated",
              baggageId: baggage._id,
              tagId: baggage.tagId,
              flightId: baggage.flightId,
              status: baggage.status,
              lastLocation: baggage.lastLocation,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      // Update Redis cache
      await redis.set(
        `baggage:${baggage.tagId}`,
        JSON.stringify({
          flightId: baggage.flightId,
          status: baggage.status,
          lastLocation: baggage.lastLocation,
          updatedAt: baggage.updatedAt,
        }),
        { EX: 7200 }
      );

      res.json({
        message: "Baggage updated successfully",
        tagId: baggage.tagId,
        status: baggage.status,
        lastLocation: baggage.lastLocation,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * READ all baggage
 */
router.get(
  "/",
  authRequired(["admin", "baggage", "airline","user"]),
  async (req, res, next) => {
    try {
      const baggages = await Baggage.find().populate("flightId");
      res.json(baggages);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * READ baggage by _id
 */
router.get(
  "/id/:id",
  authRequired(["admin", "baggage", "airline","user"]),
  async (req, res, next) => {
    try {
      const baggage = await Baggage.findById(req.params.id).populate("flightId");
      if (!baggage) return res.status(404).json({ error: "Baggage not found" });
      res.json(baggage);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * READ baggage by tagId
 */
router.get(
  "/tag/:tagId",
  authRequired(["admin", "baggage", "airline","user"]),
  async (req, res, next) => {
    try {
      const baggage = await Baggage.findOne({ tagId: req.params.tagId }).populate(
        "flightId"
      );
      if (!baggage) return res.status(404).json({ error: "Baggage not found" });
      res.json(baggage);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * READ baggage by _id + tagId
 */
router.get(
  "/:id/:tagId",
  authRequired(["admin", "baggage", "airline","user"]),
  async (req, res, next) => {
    try {
      const { id, tagId } = req.params;
      const baggage = await Baggage.findOne({ _id: id, tagId }).populate(
        "flightId"
      );
      if (!baggage) return res.status(404).json({ error: "Baggage not found" });
      res.json(baggage);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE baggage by _id
 */
// Delete Baggage API
router.delete(
  "/:id",
  authRequired(["admin", "baggage"]),
  async (req, res, next) => {
    try {
      // Check if baggage exists
      const baggage = await Baggage.findById(req.params.id);
      if (!baggage) {
        return res.status(404).json({ error: "Baggage not found" });
      }

      // Optional: Check association before deleting
      // Example: If baggage is linked to an active flight, prevent deletion
      const flight = await Flight.findById(baggage.flightId);
      if (flight) {
        return res.status(400).json({
          error: "Cannot delete baggage linked with an active flight",
          flightId: flight._id,
        });
      }

      // Delete baggage
      await Baggage.findByIdAndDelete(req.params.id);

      // Remove from Redis cache
      await redis.del(`baggage:${baggage.tagId}`);

      // Publish Kafka delete event
      await producer.send({
        topic: "baggage-events",
        messages: [
          {
            key: baggage.tagId,
            value: JSON.stringify({
              type: "baggage",
              subtype: "deleted",
              baggageId: baggage._id,
              tagId: baggage.tagId,
              flightId: baggage.flightId,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      res.json({ message: "Baggage deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);


export default router;
