export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: {
    skills: string[];
    experience: Experience[];
    education: Education[];
    summary?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Experience {
  company: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  skills?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  tags: string[];
  postedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'closed' | 'draft';
}

export interface JobApplication {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  status: 'applied' | 'reviewing' | 'interviewing' | 'offered' | 'rejected';
  appliedAt: Date;
  updatedAt: Date;
}

export interface JobSearchFilters {
  search?: string;
  location?: string;
  type?: string;
  experience?: string;
  tags?: string[];
  company?: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAfter?: Date;
  page?: number;
  limit?: number;
}

export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface GraphQLContext {
  user?: {
    id: string;
    email: string;
  };
}

// GraphQL Types
export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String!
    createdAt: String!
    updatedAt: String!
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
  }

  type Resume {
    id: ID!
    userId: ID!
    fileName: String!
    fileUrl: String!
    fileType: String!
    fileSize: Int!
    status: String!
    metadata: ResumeMetadata
    createdAt: String!
    updatedAt: String!
  }

  type ResumeMetadata {
    skills: [String!]
    experience: [Experience!]
    education: [Education!]
    summary: String
  }

  type Experience {
    company: String!
    title: String!
    startDate: String!
    endDate: String
    description: String
    skills: [String!]
  }

  type Education {
    institution: String!
    degree: String!
    field: String!
    startDate: String!
    endDate: String
    gpa: Float
  }

  type Job {
    id: ID!
    title: String!
    company: String!
    location: String!
    type: String!
    description: String!
    requirements: [String!]!
    salary: Salary
    tags: [String!]!
    postedAt: String!
    expiresAt: String
    status: String!
  }

  type Salary {
    min: Float!
    max: Float!
    currency: String!
  }

  type JobApplication {
    id: ID!
    userId: ID!
    jobId: ID!
    resumeId: ID!
    status: String!
    appliedAt: String!
    updatedAt: String!
  }

  type JobSearchResponse {
    jobs: [Job!]!
    total: Int!
    hasMore: Boolean!
    page: Int!
    limit: Int!
  }

  type Query {
    me: User
    resume(id: ID!): Resume
    resumes: [Resume!]!
    job(id: ID!): Job
    jobs(filters: JobSearchFilters): JobSearchResponse!
    jobApplication(id: ID!): JobApplication
    jobApplications: [JobApplication!]!
  }

  type Mutation {
    register(email: String!, password: String!, name: String!): AuthTokens!
    login(email: String!, password: String!): AuthTokens!
    refreshToken(refreshToken: String!): AuthTokens!
    updateProfile(name: String, email: String, currentPassword: String, newPassword: String): User!
    uploadResume(file: Upload!): Resume!
    applyToJob(jobId: ID!, resumeId: ID!): JobApplication!
    updateJobApplicationStatus(id: ID!, status: String!): JobApplication!
  }

  input JobSearchFilters {
    search: String
    location: String
    type: String
    experience: String
    tags: [String!]
    company: String
    salaryMin: Float
    salaryMax: Float
    postedAfter: String
    page: Int
    limit: Int
  }

  scalar Upload
`; 