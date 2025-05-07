import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const maxRetries = 3;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI is not defined in .env');
      }
      if (!uri.startsWith('mongodb+srv://')) {
        throw new Error('Invalid MONGODB_URI: Must start with "mongodb+srv://"');
      }
      console.log(`Attempt ${attempt}/${maxRetries} - Connecting to MongoDB with URI:`, uri.replace(/:([^@]+)@/, ':****@'));

      mongoose.connection.on('connecting', () => {
        console.log('MongoDB: Attempting connection...');
      });
      mongoose.connection.on('connected', () => {
        console.log('MongoDB: Connected successfully');
      });
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB: Disconnected');
      });
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB: Connection error event:', err.message, err.stack);
      });

      await mongoose.connect(uri, {
        connectTimeoutMS: 15000,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 30000,
        family: 4,
        maxPoolSize: 10,
        minPoolSize: 2,
        serverApi: { version: '1', strict: true, deprecationErrors: true },
        retryWrites: true,
        retryReads: true,
      });
      console.log('MongoDB connection established');
      return;
    } catch (error: any) {
      console.error(`Attempt ${attempt}/${maxRetries} - MongoDB connection error:`, error.message);
      console.error('Error code:', error.code || 'undefined');
      console.error('Error reason:', error.reason || 'No reason provided');
      console.error('Stack trace:', error.stack);
      if (attempt === maxRetries) {
        throw error;
      }
      attempt++;
      console.log(`Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
