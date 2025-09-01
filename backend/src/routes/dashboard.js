import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import Flight from "../models/flight.js";
import Baggage from "../models/Baggage.js";
import User from "../models/User.js";

const router = Router();

/**
 * GET dashboard overview
 */


router.get(
  "/overview",
  authRequired(["admin", "airline", "baggage", "user"]),
  async (req, res, next) => {
    try {
      // Date boundaries for "today"
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      // Parallel queries
      const [
        totalFlights,
        flightsToday,
        delayedFlights,
        activeFlights,
        totalBaggage,
        baggageToday,
        baggageByStatus,
        usersByRole,
      ] = await Promise.all([
        Flight.countDocuments(),
        Flight.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } }),
        Flight.countDocuments({ status: "delayed" }),
        Flight.countDocuments({ status: { $in: ["scheduled", "boarding", "departed"] } }),
        Baggage.countDocuments(),
        Baggage.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } }),
        Baggage.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      ]);

      // 🔹 Format baggage status into object
      const baggageStatusCounts = ["checkin", "loaded", "inTransit", "delivered", "lost"].reduce(
        (acc, status) => {
          const found = baggageByStatus.find((b) => b._id === status);
          acc[status] = found ? found.count : 0;
          return acc;
        },
        {}
      );

      // 🔹 Format user roles into object
      const userRoleCounts = ["admin", "airline", "baggage", "user"].reduce((acc, role) => {
        const found = usersByRole.find((u) => u._id === role);
        acc[role] = found ? found.count : 0;
        return acc;
      }, {});

      // Staff = all except passengers
      const totalStaff =
        (userRoleCounts.admin || 0) +
        (userRoleCounts.airline || 0) +
        (userRoleCounts.baggage || 0);

      // Passengers = role "user"
      const totalPassengers = userRoleCounts.user || 0;

      // 🔹 Notifications
      const delayedFlightsList = await Flight.find({ status: "delayed" })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("flightNo origin destination updatedAt")
        .lean();

      const lostBaggage = await Baggage.find({ status: "lost" })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("flightId", "flightNo origin destination")
        .select("tagId flightId updatedAt")
        .lean();

      const notifications = [
        ...delayedFlightsList.map((f) => ({
          type: "flight",
          severity: "high",
          title: `Flight Delayed - ${f.flightNo}`,
          message: `Flight ${f.flightNo} from ${f.origin} to ${f.destination} has been delayed.`,
          timestamp: f.updatedAt,
        })),
        ...lostBaggage.map((b) => ({
          type: "baggage",
          severity: "critical",
          title: `Baggage Lost - ${b.tagId}`,
          message: `Baggage ${b.tagId} lost${
            b.flightId ? ` on Flight ${b.flightId.flightNo}` : ""
          }.`,
          timestamp: b.updatedAt,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      // ✅ Response
      res.json({
        flights: {
          total: totalFlights,
          today: flightsToday,
          delayed: delayedFlights,
          active: activeFlights,
        },
        baggage: {
          total: totalBaggage,
          today: baggageToday,
          byStatus: baggageStatusCounts,
        },
        users: {
          staff: totalStaff,
          passengers: totalPassengers,
          byRole: userRoleCounts,
        },
        notifications,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);



/**
 * GET active flights
 */
router.get(
  "/active-flights",
  authRequired(["admin", "airline", "baggage", "user"]),
  async (req, res, next) => {
    try {
      // Get active flights
      const activeFlights = await Flight.find({
        status: { $in: ["scheduled", "boarding", "departed"] }
      })
      .sort({ scheduledDep: 1 })
      .select("flightNo origin destination status scheduledDep scheduledArr gate")
      .lean();

      // Get baggage count for each flight
      const flightsWithBaggage = await Promise.all(
        activeFlights.map(async (flight) => {
          const baggageCount = await Baggage.countDocuments({ 
            flightId: flight._id 
          });
          return {
            ...flight,
            baggageCount
          };
        })
      );

      res.json({
        flights: flightsWithBaggage,
        count: flightsWithBaggage.length
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET recent notifications (using only Flight and Baggage data)
 */
router.get(
  "/notifications",
  authRequired(["admin", "airline", "baggage", "user"]),
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 10;

      // Get recent delayed flights
      const delayedFlights = await Flight.find({ status: "delayed" })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select("flightNo origin destination updatedAt")
        .lean();

      // Get recent lost baggage
      const lostBaggage = await Baggage.find({ status: "lost" })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate("flightId", "flightNo origin destination")
        .select("tagId flightId updatedAt")
        .lean();

      // Format notifications using only Flight and Baggage data
      const notifications = [
        ...delayedFlights.map(flight => ({
          type: "flight",
          severity: "high",
          title: `Flight Delayed - ${flight.flightNo}`,
          message: `Flight ${flight.flightNo} from ${flight.origin} to ${flight.destination} has been delayed`,
          timestamp: flight.updatedAt,
          relatedFlight: {
            flightNo: flight.flightNo,
            origin: flight.origin,
            destination: flight.destination
          }
        })),
        ...lostBaggage.map(baggage => ({
          type: "baggage",
          severity: "critical",
          title: `Baggage Lost - ${baggage.tagId}`,
          message: `Baggage ${baggage.tagId} has been marked as lost`,
          timestamp: baggage.updatedAt,
          relatedFlight: baggage.flightId ? {
            flightNo: baggage.flightId.flightNo,
            origin: baggage.flightId.origin,
            destination: baggage.flightId.destination
          } : null
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
       .slice(0, limit);

      res.json({
        notifications,
        unreadCount: notifications.length
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET flight statistics by status
 */
router.get(
  "/flight-stats",
  authRequired(["admin", "airline", "baggage", "user"]),
  async (req, res, next) => {
    try {
      const flightStats = await Flight.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const totalFlights = await Flight.countDocuments();

      // Convert to object format
      const statsByStatus = flightStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      res.json({
        byStatus: statsByStatus,
        total: totalFlights
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET baggage overview
 */
router.get(
  "/baggage-overview",
  authRequired(["admin", "airline", "baggage", "user"]),
  async (req, res, next) => {
    try {
      // Get current date boundaries for today's counts
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const [
        totalBaggage,
        baggageToday,
        baggageByStatus,
        recentBaggage
      ] = await Promise.all([
        Baggage.countDocuments(),
        Baggage.countDocuments({
          createdAt: { $gte: startOfToday, $lte: endOfToday }
        }),
        Baggage.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]),
        Baggage.find()
          .sort({ updatedAt: -1 })
          .limit(10)
          .populate("flightId", "flightNo origin destination")
          .select("tagId status flightId updatedAt")
          .lean()
      ]);

      // Convert baggage status array to object
      const statusCounts = baggageByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      res.json({
        total: totalBaggage,
        today: baggageToday,
        byStatus: statusCounts,
        recent: recentBaggage
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET system health status
 */
router.get(
  "/system-health",
  authRequired(["admin", "airline", "baggage", "user"]),
  async (req, res, next) => {
    try {
      // Simple health check - try to query both collections
      const [flightCount, baggageCount] = await Promise.all([
        Flight.countDocuments().limit(1),
        Baggage.countDocuments().limit(1)
      ]);

      // Calculate uptime (in seconds)
      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
      const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
      const uptimeString = `${days} days, ${hours} hours`;

      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

      res.json({
        status: "healthy",
        uptime: uptimeString,
        memoryUsage: `${memoryUsagePercent}%`,
        database: {
          status: "connected",
          flights: flightCount >= 0,
          baggage: baggageCount >= 0
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      res.json({
        status: "degraded",
        uptime: "unknown",
        memoryUsage: "unknown",
        database: {
          status: "disconnected",
          error: err.message
        },
        lastUpdated: new Date().toISOString()
      });
    }
  }
);

export default router;