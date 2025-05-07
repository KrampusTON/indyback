import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import referralRoutes from './routes/referralRoutes';
import saleRoutes from './routes/saleRoutes';
import taskRoutes from './routes/taskRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Logovanie štartu servera
console.log('Initializing Indianadog Backend API...');

// Nastavenie CORS
const corsOptions = {
  origin: [
    'https://sb1sc4kvuv2-1g4t--3000--4d9fd228.local-credentialless.webcontainer.io',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-address', 'x-signature', 'address'],
  credentials: true,
};

// Logovanie CORS požiadaviek
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Received ${req.method} request to ${req.url} from origin: ${req.headers.origin}`);
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use('/api/referrals', referralRoutes);
app.use('/api/sale', saleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
  console.log('Handling GET request to /');
  res.send('Indianadog Backend API');
});

// Fallback pre 404
app.use((req: Request, res: Response) => {
  console.log(`404: Request to ${req.url} not found`);
  res.status(404).json({ error: 'Not Found' });
});

const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log('Checking environment variables...');
    console.log('Raw MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
    console.log('MONGODB_URI:', process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':****@'));
    console.log('PORT:', process.env.PORT);
    console.log('ADMIN_ADDRESSES:', process.env.ADMIN_ADDRESSES);

    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI is not defined. Continuing without database...');
    } else {
      console.log('Initiating MongoDB connection...');
      try {
        await connectDatabase();
        console.log('MongoDB connected successfully');
      } catch (dbError: any) {
        console.error('MongoDB connection failed:', dbError.message);
        console.warn('Continuing without database connection...');
      }
    }

    if (process.env.VERCEL !== '1') {
      console.log('Starting Express server...');
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      }).on('error', (err) => {
        console.error('Server error:', err.message, err.stack);
      });
    }
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

startServer().catch((err) => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message, error.stack);
  process.exit(1);
});

export default app;
