import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import referralRoutes from './routes/referralRoutes';
import saleRoutes from './routes/saleRoutes';
import taskRoutes from './routes/taskRoutes';
import adminRoutes from './routes/adminRoutes';
import dns from 'dns';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minút
  max: 100, // Max 100 požiadaviek na IP
});
app.use(limiter);

app.use('/api/referrals', referralRoutes);
app.use('/api/sale', saleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Indianadog Backend API');
});

const testNetwork = async () => {
  try {
    console.log('Testing DNS resolution for MongoDB...');
    await dns.promises.resolve('indy.bqoteca.mongodb.net');
    console.log('DNS resolution successful');
  } catch (err: any) {
    console.error('DNS resolution error:', err.message, err.stack);
    throw err;
  }
};

const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log('Checking environment variables...');
    console.log('Raw MONGODB_URI:', process.env.MONGODB_URI);
    console.log(
      'MONGODB_URI:',
      process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':****@')
    );
    console.log('PORT:', process.env.PORT);
    console.log('ADMIN_ADDRESSES:', process.env.ADMIN_ADDRESSES);

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    // Test siete
    await testNetwork();

    console.log('Attempting to connect to MongoDB...');
    await connectDatabase();
    console.log('MongoDB connected successfully');

    app
      .listen(port, () => {
        console.log(`Server running on port ${port}`);
      })
      .on('error', (err) => {
        console.error('Server error:', err.message, err.stack);
      });
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Stack trace:', error.stack);
    // Oneskorenie pre zapísanie logov
    await new Promise((resolve) => setTimeout(resolve, 2000));
    process.exit(1);
  }
};

// Zachytávanie neošetrených chýb
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message, error.stack);
  process.exit(1);
});

startServer();
