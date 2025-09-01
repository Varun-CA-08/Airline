import { consumer } from '../config/kafka.js';
import { io } from '../server.js';

export async function runRealtimeBridge() {
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const value = message.value?.toString() || '{}';
        const evt = JSON.parse(value);

        if (topic === 'flight-events') {
          // broadcast to flight room and global dashboard
          io.to(`flight:${evt.flightId}`).emit('flight-update', evt);
          io.to('dash:ops').emit('flight-update', evt);
        }

        if (topic === 'baggage-events') {
          io.to(`baggage:${evt.tagId}`).emit('baggage-update', evt);
          io.to('dash:ops').emit('baggage-update', evt);
        }
      } catch (e) {
        console.error('Consumer parse error', e);
      }
    }
  });

  // Simple authless join for training (secure later)
  io.on('connection', (socket) => {
    socket.on('join', (room) => socket.join(room)); // e.g., 'dash:ops'
  });

  console.log(' Realtime Kafka→Socket bridge running');
}
