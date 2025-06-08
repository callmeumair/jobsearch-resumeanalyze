import { APIGatewayProxyHandler } from 'aws-lambda';
import { connectDB } from '../lib/mongodb';
import { JobModel } from '../models/Job';
import { UserModel } from '../models/User';
import { ResumeModel } from '../models/Resume';
import { log } from '../lib/logger';
import { verifyToken } from '../lib/auth';
import { z } from 'zod';

// Schema for job creation/update
const jobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  description: z.string().min(1),
  requirements: z.array(z.string()),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('USD'),
  }).optional(),
  tags: z.array(z.string()),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).default('DRAFT'),
  expiresAt: z.string().datetime().optional(),
});

// Middleware to check admin role
const requireAdmin = async (event: any) => {
  const user = await verifyToken(event);
  if (!user) {
    throw new Error('Unauthorized');
  }

  const dbUser = await UserModel.findById(user.id);
  if (!dbUser || dbUser.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }

  return dbUser;
};

// List all jobs with pagination and filters
export const listJobs: APIGatewayProxyHandler = async (event) => {
  try {
    await requireAdmin(event);
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page || '1');
    const limit = parseInt(queryParams.limit || '10');
    const status = queryParams.status;
    const search = queryParams.search;

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      JobModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      JobModel.countDocuments(query),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }),
    };
  } catch (error) {
    log.error('Error listing jobs', error as Error);
    return {
      statusCode: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      body: JSON.stringify({ message: error instanceof Error ? error.message : 'Internal server error' }),
    };
  }
};

// Create a new job
export const createJob: APIGatewayProxyHandler = async (event) => {
  try {
    await requireAdmin(event);
    await connectDB();

    const jobData = jobSchema.parse(JSON.parse(event.body || '{}'));
    const job = await JobModel.create(jobData);

    log.info('Job created', { jobId: job._id });
    return {
      statusCode: 201,
      body: JSON.stringify(job),
    };
  } catch (error) {
    log.error('Error creating job', error as Error);
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Validation error', errors: error.errors }),
      };
    }
    return {
      statusCode: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      body: JSON.stringify({ message: error instanceof Error ? error.message : 'Internal server error' }),
    };
  }
};

// Update a job
export const updateJob: APIGatewayProxyHandler = async (event) => {
  try {
    await requireAdmin(event);
    await connectDB();

    const jobId = event.pathParameters?.jobId;
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    const jobData = jobSchema.parse(JSON.parse(event.body || '{}'));
    const job = await JobModel.findByIdAndUpdate(jobId, jobData, { new: true });

    if (!job) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Job not found' }),
      };
    }

    log.info('Job updated', { jobId });
    return {
      statusCode: 200,
      body: JSON.stringify(job),
    };
  } catch (error) {
    log.error('Error updating job', error as Error);
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Validation error', errors: error.errors }),
      };
    }
    return {
      statusCode: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      body: JSON.stringify({ message: error instanceof Error ? error.message : 'Internal server error' }),
    };
  }
};

// Delete a job
export const deleteJob: APIGatewayProxyHandler = async (event) => {
  try {
    await requireAdmin(event);
    await connectDB();

    const jobId = event.pathParameters?.jobId;
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    const job = await JobModel.findByIdAndDelete(jobId);
    if (!job) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Job not found' }),
      };
    }

    log.info('Job deleted', { jobId });
    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    log.error('Error deleting job', error as Error);
    return {
      statusCode: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      body: JSON.stringify({ message: error instanceof Error ? error.message : 'Internal server error' }),
    };
  }
};

// Get dashboard statistics
export const getDashboardStats: APIGatewayProxyHandler = async (event) => {
  try {
    await requireAdmin(event);
    await connectDB();

    const [totalUsers, totalJobs, totalResumes, recentResumes] = await Promise.all([
      UserModel.countDocuments(),
      JobModel.countDocuments(),
      ResumeModel.countDocuments(),
      ResumeModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'email name'),
    ]);

    const jobStats = await JobModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const resumeStats = await ResumeModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        users: {
          total: totalUsers,
        },
        jobs: {
          total: totalJobs,
          byStatus: jobStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        },
        resumes: {
          total: totalResumes,
          byStatus: resumeStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
          recent: recentResumes,
        },
      }),
    };
  } catch (error) {
    log.error('Error getting dashboard stats', error as Error);
    return {
      statusCode: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      body: JSON.stringify({ message: error instanceof Error ? error.message : 'Internal server error' }),
    };
  }
}; 