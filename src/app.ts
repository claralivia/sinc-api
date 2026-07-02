import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import {
  aiRoutes,
  cardRoutes,
  categoryRoutes,
  dashboardRoutes,
  goalRoutes,
  recurringExpenseRoutes,
  transactionRoutes,
  userRoutes,
  whatsappRoutes,
} from './routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

connectDB();

app.use('/api', aiRoutes);
app.use('/api', cardRoutes);
app.use('/api', categoryRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', goalRoutes);
app.use('/api', recurringExpenseRoutes);
app.use('/api', transactionRoutes);
app.use('/api', userRoutes);
app.use('/api', whatsappRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'O servidor está respondendo!' });
});


export { app };
