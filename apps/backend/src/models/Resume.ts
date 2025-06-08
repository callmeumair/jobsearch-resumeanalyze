import mongoose from 'mongoose';

export interface IResume {
  userId: mongoose.Types.ObjectId;
  originalFile: string;
  parsedFile?: string;
  status: 'PENDING' | 'PARSING' | 'PARSED' | 'ENHANCING' | 'ENHANCED' | 'FAILED';
  parsedData?: {
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    experience?: Array<{
      company: string;
      title: string;
      duration: string;
      description: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      year: string;
    }>;
    skills?: string[];
  };
  enhancedData?: {
    summary?: string;
    experience?: Array<{
      company: string;
      title: string;
      duration: string;
      description: string;
      enhancedDescription: string;
    }>;
    skills?: Array<{
      name: string;
      level: string;
      category: string;
    }>;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new mongoose.Schema<IResume>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFile: { type: String, required: true },
  parsedFile: String,
  status: {
    type: String,
    enum: ['PENDING', 'PARSING', 'PARSED', 'ENHANCING', 'ENHANCED', 'FAILED'],
    default: 'PENDING',
  },
  parsedData: {
    name: String,
    email: String,
    phone: String,
    summary: String,
    experience: [{
      company: String,
      title: String,
      duration: String,
      description: String,
    }],
    education: [{
      institution: String,
      degree: String,
      year: String,
    }],
    skills: [String],
  },
  enhancedData: {
    summary: String,
    experience: [{
      company: String,
      title: String,
      duration: String,
      description: String,
      enhancedDescription: String,
    }],
    skills: [{
      name: String,
      level: String,
      category: String,
    }],
  },
  error: String,
}, {
  timestamps: true,
});

export const Resume = mongoose.model<IResume>('Resume', resumeSchema); 