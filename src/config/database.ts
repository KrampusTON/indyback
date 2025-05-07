import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    // Skontroluj MONGODB_URI
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env');
    }
    if (!uri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MONGODB_URI: Must start with "mongodb+srv://"');
    }
    console.log(
      'Connecting to MongoDB with URI:',
      uri.replace(/:([^@]+)@/, ':****@')
    );

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

    // Pripoj sa s pokusmi o znovupripojenie
    await mongoose.connect(uri, {
      connectTimeoutMS: 60000, // 60 sekúnd
      serverSelectionTimeoutMS: 60000, // 60 sekúnd
      socketTimeoutMS: 90000, // 90 sekúnd
      family: 4, // Použiť IPv4
      maxPoolSize: 10,
      minPoolSize: 2,
      serverApi: { version: '1', strict: true, deprecationErrors: true },
      retryWrites: true,
      retryReads: true,
    });
    console.log('MongoDB connection established');

    // Testovací dokument
    const sampleSchema = new mongoose.Schema({ name: String });
    const SampleModel = mongoose.model(
      'Sample',
      sampleSchema,
      'testcollection'
    );
    const newDoc = new SampleModel({ name: 'Test Document' });
    await newDoc.save();
    console.log('Document saved to indianadog database!');
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message);
    console.error('Error code:', error.code || 'undefined');
    console.error('Error reason:', error.reason || 'No reason provided');
    console.error('Stack trace:', error.stack);
    throw error;
  }
};
