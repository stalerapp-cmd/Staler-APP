
import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { supabase } from './config/supabase';

import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/walletRoutes';
import bankRoutes from './routes/bankRoutes';
import merchantRoutes from './routes/merchantRoutes';
import storeRoutes from './routes/storeRoutes';
import adminRoutes from './routes/adminRoutes';
import exchangeRoutes from './routes/exchange';
import messagesRoutes from './routes/messagesRoutes';


const app: Application = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.use((req: Request, _res: Response, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'S-Taler API v2.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('wallets')
      .select('id')
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      status: 'healthy',
      services: {
        api: 'online',
        database: 'supabase-connected',
      },
    });
  } catch (err: any) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: err.message,
    });
  }
});


app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/messages', messagesRoutes);

app.use('/api/bank', bankRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/exchange', exchangeRoutes);


app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});


app.use(errorHandler);


app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('✨ S-Taler API v2.0 Running (Supabase) ✨');
  console.log('========================================');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`💳 Currency: ${process.env.TALER_CURRENCY || 'PS'}`);
  console.log('========================================\n');
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

export default app;
