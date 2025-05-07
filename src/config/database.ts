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
        console.error('Error details:', JSON.stringify(err, null, 2));
      });

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
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (attempt === maxRetries) {
        throw error;
      }
      attempt++;
      console.log(`Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
