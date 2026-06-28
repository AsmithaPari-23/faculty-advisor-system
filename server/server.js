import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB, getDbMode } from './config/db.js';
import { seedDatabase } from './utils/seedData.js';

// Route imports
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import successRoutes from './routes/success.js';
import careerRoutes from './routes/career.js';
import futureMeRoutes from './routes/futureMe.js';
import advisorRoutes from './routes/advisor.js';
import adminRoutes from './routes/admin.js';
import telemetryRoutes from './routes/telemetry.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development accessibility
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Save io reference globally for controller access
global.io = io;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Mounts
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/student-success', successRoutes);
app.use('/api/career-dna', careerRoutes);
app.use('/api/future-me', futureMeRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Health Check API
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    dbMode: getDbMode(),
    timestamp: new Date()
  });
});

// Socket.io Handlers
io.on('connection', (socket) => {
  console.log(`Websocket client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Socket client ${socket.id} joined channel: ${userId}`);
  });

  socket.on('join_admin', () => {
    socket.join('admin');
    console.log(`Socket client ${socket.id} joined admin channel`);
  });

  socket.on('disconnect', () => {
    console.log(`Websocket client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Database, Seed, and Start Server
const startServer = async () => {
  await connectDB();
  await seedDatabase();

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  SERVER IS RUNNING ON PORT: http://localhost:${PORT}`);
    console.log(`  DATABASE RUNNING IN MODE: [${getDbMode()}]`);
    console.log(`====================================================`);
  });
};

startServer();
