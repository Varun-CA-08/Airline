import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Flight from '../models/flight.js';
import Baggage from '../models/Baggage.js';
import { producer } from '../config/kafka.js';
import { redis } from '../config/redis.js';
import { parseISO } from 'date-fns';

const router = Router();

/**
 * Delay notification (publishes Kafka flight-event + caches in Redis)
 */
router.post('/flights/:id/delay', authRequired(['admin','airline']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, newTime } = req.body;

    // Prepare update object
    const updateData = { 
      status: 'delayed'
    };

    if (newTime) {
      updateData.scheduledDep = parseISO(newTime);
    }

    const f = await Flight.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!f) return res.status(404).json({ error: 'Flight not found' });

    // Publish Kafka event
    await producer.send({
      topic: 'flight-events',
      messages: [{
        key: f.flightNo,
        value: JSON.stringify({
          type: 'flight',
          subtype: 'delayed',
          flightId: f._id,
          flightNo: f.flightNo,
          payload: { reason, newTime }
        })
      }]
    });

    // Update Redis cache for this flight
    await redis.set(
      `flight:${f._id}:status`,
      JSON.stringify({
        flightNo: f.flightNo,
        gate: f.gate,
        status: f.status,
        scheduledDep: f.scheduledDep,
        scheduledArr: f.scheduledArr
      }),
      { EX: 3600 }
    );

    // ✅ INVALIDATE ANALYTICS CACHE - This is the key change!
    await redis.del('analytics:today');

    res.json({ 
      message: 'Delay notification sent',
      updatedFlight: f
    });
    
  } catch (err) {
    console.error('Error in delay endpoint:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
/**
 * Simple analytics (today) - combines Flights + Baggage
 */
router.get('/analytics', authRequired(['admin','airline']), async (req, res) => {
  try {
    // 1️⃣ Try fetching from Redis first
    const cachedData = await redis.get('analytics:today');
    if (cachedData) {
      return res.json({
        source: 'redis',
        data: JSON.parse(cachedData)
      });
    }

    // 2️⃣ Fetch from MongoDB if not in Redis
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    const totalFlightsToday = await Flight.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const totalBaggageProcessed = await Baggage.countDocuments({
      updatedAt: { $gte: start, $lte: end },
      status: { $in: ['loaded','unloaded','atBelt'] }
    });

    const data = { totalFlightsToday, totalBaggageProcessed };

    // 3️⃣ Save to Redis for future requests
    await redis.set('analytics:today', JSON.stringify(data), { EX: 3600 });

    // 4️⃣ Send response with source
    res.json({
      source: 'mongodb',
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
