import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGO_URI as string
    );

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`MongoDB connection failed: ${error.message}`);
    } else {
      console.error("MongoDB connection failed");
    }

    process.exit(1);
  }
};

export default connectDB;