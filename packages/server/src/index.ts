import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { transactionsRouter } from './routes/transactions.js';
import { categoriesRouter } from './routes/categories.js';
import { accountsRouter } from './routes/accounts.js';
import { budgetsRouter } from './routes/budgets.js';
import { reportsRouter } from './routes/reports.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Muitas requisições' } });
app.use('/api/', limiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'financehub' }));

app.use('/api/auth', authRouter);
app.use('/api/transactions', authMiddleware, transactionsRouter);
app.use('/api/categories', authMiddleware, categoriesRouter);
app.use('/api/accounts', authMiddleware, accountsRouter);
app.use('/api/budgets', authMiddleware, budgetsRouter);
app.use('/api/reports', authMiddleware, reportsRouter);

app.use(errorHandler);

app.listen(PORT, () => console.log(`💰 FinanceHub API running on http://localhost:${PORT}`));