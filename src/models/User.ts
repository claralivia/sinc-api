import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  supabaseId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  phone?: string;
  avatarUrl?: string;
}

const UserSchema = new Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    phone: { type: String },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
