# Job Search Resume Analyzer

A full-stack application for job search and resume analysis, built with Next.js, AWS Lambda, and MongoDB.

## Architecture

- **Frontend**: Next.js application deployed on Vercel
- **Backend**: AWS Lambda functions managed by Serverless Framework
- **Database**: MongoDB Atlas
- **Search**: AWS OpenSearch (Elasticsearch)
- **Message Queue**: RabbitMQ
- **Storage**: AWS S3 for resume files
- **Authentication**: JWT-based auth with refresh tokens

## Prerequisites

- Node.js 18.x
- AWS CLI configured with appropriate credentials
- MongoDB Atlas account
- Vercel account
- GitHub account

## Environment Variables

### Backend (.env)

```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# MongoDB
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Elasticsearch
ELASTICSEARCH_URL=your_elasticsearch_url

# RabbitMQ
RABBITMQ_URL=your_rabbitmq_url

# S3
RESUME_BUCKET=your_bucket_name
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_GRAPHQL_URL=your_graphql_url
```

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/jobsearch-resumeanalyze.git
   cd jobsearch-resumeanalyze
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start local services with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Start the backend development server:
   ```bash
   cd apps/backend
   npm run dev
   ```

5. Start the frontend development server:
   ```bash
   cd apps/frontend
   npm run dev
   ```

## Deployment

### Backend (AWS)

1. Configure AWS credentials:
   ```bash
   aws configure
   ```

2. Deploy to AWS:
   ```bash
   cd apps/backend
   npm run deploy -- --stage prod
   ```

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deployments will be automatic via GitHub Actions

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

1. **Test**: Runs linting and tests on pull requests
2. **Deploy Backend**: Deploys Lambda functions to AWS on main branch
3. **Deploy Frontend**: Deploys Next.js app to Vercel on main branch

## Infrastructure Setup

### MongoDB Atlas

1. Create a new cluster
2. Set up database user and password
3. Configure network access (IP whitelist)
4. Get connection string

### AWS OpenSearch

1. Create a new domain
2. Configure security groups
3. Set up access policies
4. Get endpoint URL

### RabbitMQ

#### Cloud (CloudAMQP)

1. Create a new instance
2. Get connection URL
3. Configure security groups

#### Local (Docker)

```bash
docker-compose up -d rabbitmq
```

Access management UI at http://localhost:15672 (admin/admin123)

### AWS S3

1. Create a new bucket
2. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "MaxAge": 3000
     }
   ]
   ```

## Monitoring and Logging

- AWS CloudWatch for Lambda logs
- MongoDB Atlas monitoring
- Vercel analytics
- GitHub Actions logs

## Security

- JWT tokens for authentication
- HTTPS for all endpoints
- CORS configuration
- AWS IAM roles and policies
- MongoDB network access control
- Environment variables for secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

MIT 