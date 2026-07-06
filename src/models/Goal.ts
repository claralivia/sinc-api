import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  householdId: mongoose.Types.ObjectId;
  deletedAt?: Date;
}

const GoalSchema = new Schema(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IGoal>('Goal', GoalSchema);
