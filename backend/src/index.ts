import express from 'express';
import cors from 'cors';
import { getDB } from './db';
import functionsRouter from './routes/functions';
import graphRouter from './routes/graph';
import sourcesRouter from './routes/sources';
import packagesRouter from './routes/packages';
import statsRouter from './routes/stats';
import dataflowRouter from './routes/dataflow';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Check database connection on startup
try {
  getDB();
  console.log('✓ Database connected');
} catch (error) {
  console.error('✗ Database connection error:', error);
  process.exit(1);
}

// API routes
app.use('/api/functions', functionsRouter);
app.use('/api/graph', graphRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/dataflow', dataflowRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API available at http://localhost:${PORT}/api`);
});

