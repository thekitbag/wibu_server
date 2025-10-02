import express from 'express';
import { PrismaClient } from '@prisma/client';
import journeyRoutes from './routes/journeys';
import webhookRoutes from './routes/webhooks';
import revealRoutes from './routes/reveal';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// Webhook routes need to be defined BEFORE express.json() middleware
// to ensure raw body is available for signature verification
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'WIBU Server is running' });
});

app.use('/api/journeys', journeyRoutes);
app.use('/api/reveal', revealRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export { app, prisma };
