import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  supabaseId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  phone?: string;
  avatarUrl?: string;
  householdId?: mongoose.Types.ObjectId | null;
  managedUserId?: mongoose.Types.ObjectId | null;
}

const UserSchema = new Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    phone: { type: String },
    avatarUrl: { type: String },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', default: null },
    managedUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
