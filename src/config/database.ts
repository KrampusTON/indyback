import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const maxRetries = 3;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      // Skontroluj MONGODB_URI
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI is not defined in .env');
      }
      if (!uri.startsWith('mongodb+srv://')) {
        throw new Error('Invalid MONGODB_URI: Must start with "mongodb+srv://"');
      }
      console.log(`Attempt ${attempt}/${maxRetries} - Connecting to MongoDB with URI:`, uri.replace(/:([^@]+)@/, ':****@'));

      // Event listenery
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

      // Pripoj sa
      await mongoose.connect(uri, {
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        family: 4,
        maxPoolSize: 5,
        minPoolSize: 1,
        serverApi: { version: '1', strict: true, deprecationErrors: true },
        retryWrites: true,
        retryReads: true,
      });
      console.log('MongoDB connection established');

      // Testovací dokument
      const sampleSchema = new mongoose.Schema({ name: String });
      const SampleModel = mongoose.model('Sample', sampleSchema, 'testcollection');
      const newDoc = new SampleModel({ name: 'Test Document' });
      await newDoc.save();
      console.log('Document saved to indianadog database!');
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
