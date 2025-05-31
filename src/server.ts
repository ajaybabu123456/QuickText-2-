import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import routes from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Connect to MongoDB
connectDB();

// WebSocket handling for real-time sharing
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room based on share code for real-time updates
  socket.on('join-share', (shareCode) => {
    socket.join(shareCode);
    console.log(`User ${socket.id} joined share room: ${shareCode}`);
  });

  // Handle real-time content updates
  socket.on('content-update', (data) => {
    socket.to(data.shareCode).emit('content-updated', {
      content: data.content,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});
