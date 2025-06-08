# Job Search Resume Analyzer

A monorepo containing a Next.js frontend and AWS Lambda backend for analyzing resumes and managing job applications.

## Project Structure

```
.
├── apps/
│   ├── frontend/     # Next.js frontend application
│   └── backend/      # AWS Lambda functions
├── packages/
│   └── types/        # Shared TypeScript types
└── package.json      # Root package.json
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- AWS CLI configured (for backend deployment)

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development servers:
   ```bash
   # Start both frontend and backend
   pnpm dev

   # Or start them separately
   pnpm --filter @jobsearch-resumeanalyze/frontend dev
   pnpm --filter @jobsearch-resumeanalyze/backend dev
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

## Development

- Frontend runs on http://localhost:3000
- Backend runs on http://localhost:4000
- Backend API Gateway endpoint (when deployed): https://[api-id].execute-api.[region].amazonaws.com/dev

## Available Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications
- `pnpm lint` - Run ESLint on all packages
- `pnpm format` - Format all files with Prettier
- `pnpm clean` - Clean all build artifacts

## Deployment

### Backend (AWS Lambda)

1. Configure AWS credentials:
   ```bash
   aws configure
   ```

2. Deploy to AWS:
   ```bash
   cd apps/backend
   pnpm deploy
   ```

### Frontend (Next.js)

The frontend can be deployed to Vercel or any other Next.js-compatible hosting platform.

## License

MIT 