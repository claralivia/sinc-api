import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  role: 'ADMIN' | 'USER';
  phone: string;
  avatarUrl?: string;
}

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    phone: { type: String, required: true, unique: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);