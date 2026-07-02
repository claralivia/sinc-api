import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB conectado com sucesso');
  } catch (error) {
    console.error('Erro na conexão com o MongoDB:', error);
    process.exit(1);
  }
};