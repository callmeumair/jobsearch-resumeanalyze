import mongoose from 'mongoose';
import { Resume } from '@jobsearch-resumeanalyze/types';

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
  description: String,
  skills: [String],
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true,
  },
  degree: {
    type: String,
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
  gpa: Number,
});

const resumeSchema = new mongoose.Schema<Resume>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    metadata: {
      skills: [String],
      experience: [experienceSchema],
      education: [educationSchema],
      summary: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
resumeSchema.index({ userId: 1 });
resumeSchema.index({ status: 1 });
resumeSchema.index({ 'metadata.skills': 1 });

export const ResumeModel = mongoose.model<Resume>('Resume', resumeSchema); 