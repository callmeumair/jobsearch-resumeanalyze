import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';
import { verifyToken } from '../lib/auth';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

const querySchema = z.object({
  fileName: z.string(),
  fileType: z.string().refine(
    (type) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type),
    'File type must be PDF or DOC/DOCX'
  ),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Verify JWT token
    const user = await verifyToken(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Unauthorized',
        }),
      };
    }

    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};
    const { fileName, fileType } = querySchema.parse(queryParams);

    // Generate a unique key for the file
    const key = `resumes/${user.id}/${Date.now()}-${fileName}`;

    // Create the S3 command
    const command = new PutObjectCommand({
      Bucket: process.env.RESUME_BUCKET,
      Key: key,
      ContentType: fileType,
      // Add metadata to track the user
      Metadata: {
        userId: user.id,
      },
    });

    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        uploadUrl: presignedUrl,
        key,
      }),
    };
  } catch (error) {
    console.error('Presigned URL error:', error);

    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Validation error',
          errors: error.errors,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
}; 