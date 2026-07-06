import mongoose, { Schema, Document } from 'mongoose';

export interface IHousehold extends Document {
  name?: string;
  members: mongoose.Types.ObjectId[];
}

const HouseholdSchema = new Schema(
  {
    name: { type: String },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model<IHousehold>('Household', HouseholdSchema);
