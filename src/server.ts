import express from 'express';
import { PrismaClient } from '@prisma/client';
import journeyRoutes from './routes/journeys';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'WIBU Server is running' });
});

app.use('/api/journeys', journeyRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export { app, prisma };
