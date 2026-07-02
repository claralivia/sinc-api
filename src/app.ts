import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import { aiRoutes, categoryRoutes, dashboardRoutes, transactionRoutes, userRoutes, whatsappRoutes } from './routes';

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api', aiRoutes);
app.use('/api', categoryRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', transactionRoutes);
app.use('/api', userRoutes);
app.use('/api', whatsappRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'O servidor está respondendo!' });
});


export { app };
