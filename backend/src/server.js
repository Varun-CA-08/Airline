import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import morgan from "morgan";
import { Server as SocketIOServer } from 'socket.io';
 import baggageRoutes from './routes/baggage.js';
 import opsRoutes from './routes/ops.js' ;
import authRoutes from './routes/auth.js';
import flightsRoutes from './routes/flights.js';
import { connectMongo } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { connectKafka, consumer } from './config/kafka.js';
 import { runRealtimeBridge } from './realtime/streamToSocket.js'
 import dashboardRoutes from "./routes/dashboard.js";
const app = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, { 
  cors: { 
    origin: "http://localhost:5173",
    credentials: true 
  } 
});

app.use(cors({
  origin: "http://localhost:5173", // your frontend dev server
  credentials: true                // allow cookies/headers
}));

app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/baggage', baggageRoutes);
// app.use('/api', opsRoutes);
app.use('/api/flights', flightsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/operations", opsRoutes);
// // health
app.get('/health', (_, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 4000;
const start = async () => {
    try {
        await connectMongo(process.env.MONGO_URI);
        await connectRedis();
        await connectKafka();

        //Subscribe BEFORE running consumer
        await consumer.subscribe({ topic: 'flight-events', fromBeginning: true });
        await consumer.subscribe({ topic: 'baggage-events', fromBeginning: true });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log(` [${topic}] ${message.key?.toString()} => ${message.value?.toString()}`);
            },
        }
        );
        // //Bridge Kafka -> Socket.io (after consumer is ready)

         await runRealtimeBridge();
        server.listen(PORT,'0.0.0.0',() =>
            console.log(` Server running on http://localhost:${PORT}`)

        );
    } catch (err) {
        console.error(' Server start failed:', err);
    }
};
start();

