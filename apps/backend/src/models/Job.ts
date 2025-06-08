import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  description: string;
  requirements: string[];
  salary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'],
      required: true,
    },
    description: { type: String, required: true },
    requirements: [{ type: String, required: true }],
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
      default: 'DRAFT',
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ type: 1, location: 1 });

export const JobModel = mongoose.model<IJob>('Job', jobSchema); 