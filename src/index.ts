import express from 'express';
import cors from 'cors';
import referralRoutes from './routes/referrals';
import saleRoutes from './routes/saleRoutes';
import taskRoutes from './routes/taskRoutes';
import adminRoutes from './routes/adminRoutes';
import { connectDatabase } from './config/database';

const app = express();

// CORS nastavenie pre frontend
app.use(cors({ 
  origin: 'https://indiana-three.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-address', 'x-signature', 'address'],
  credentials: true,
}));

// Parsovanie JSON a URL-encoded dát
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logovanie požiadaviek
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Request: ${req.method} ${req.url} from origin: ${req.headers.origin}`);
  res.on('finish', () => {
    console.log(`Response: ${req.method} ${req.url} status: ${res.statusCode}`);
  });
  next();
});

// Routy
app.use('/api/referrals', referralRoutes);
app.use('/api/sale', saleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

// Testovacia routa
app.get('/', (req: Request, res: Response) => {
  console.log('Handling GET request to /');
  res.json({ message: 'Indianadog Backend API is running' });
});

// Fallback pre 404
app.use((req: Request, res: Response) => {
  console.log(`404: Request to ${req.url} not found`);
  res.status(404).json({ error: 'Not Found' });
});

// Pripojenie k databáze (ak je MONGODB_URI definované)
if (process.env.MONGODB_URI) {
  connectDatabase().catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
  });
} else {
  console.warn('MONGODB_URI not defined, running without database');
}

export default app;
