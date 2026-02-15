import express from 'express';
import cors from 'cors';
import { getDB } from './db';
import functionsRouter from './routes/functions';
import graphRouter from './routes/graph';
import sourcesRouter from './routes/sources';
import packagesRouter from './routes/packages';
import statsRouter from './routes/stats';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Проверка подключения к БД при старте
try {
  getDB();
  console.log('✓ База данных подключена');
} catch (error) {
  console.error('✗ Ошибка подключения к базе данных:', error);
  process.exit(1);
}

// API routes
app.use('/api/functions', functionsRouter);
app.use('/api/graph', graphRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Обработка ошибок
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`✓ Сервер запущен на порту ${PORT}`);
  console.log(`✓ API доступен по адресу http://localhost:${PORT}/api`);
});

