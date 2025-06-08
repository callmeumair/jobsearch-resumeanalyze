import { APIGatewayProxyHandler } from 'aws-lambda';
import { connectDB } from '../lib/mongodb';
import { UserModel } from '../models/User';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AuthTokens } from '@jobsearch-resumeanalyze/types';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const generateTokens = (userId: string): AuthTokens => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    await connectDB();

    const path = event.path.replace('/auth/', '');
    const body = event.body ? JSON.parse(event.body) : {};

    switch (path) {
      case 'register': {
        const { email, password, name } = registerSchema.parse(body);

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'User already exists',
            }),
          };
        }

        // Create new user
        const user = await UserModel.create({ email, password, name });
        const tokens = generateTokens(user.id);

        return {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            user: user.toJSON(),
            ...tokens,
          }),
        };
      }

      case 'login': {
        const { email, password } = loginSchema.parse(body);

        // Find user and verify password
        const user = await UserModel.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
          return {
            statusCode: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'Invalid email or password',
            }),
          };
        }

        const tokens = generateTokens(user.id);

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            user: user.toJSON(),
            ...tokens,
          }),
        };
      }

      case 'refresh': {
        const { refreshToken } = refreshTokenSchema.parse(body);

        try {
          // Verify refresh token
          const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET!
          ) as { userId: string };

          // Generate new tokens
          const tokens = generateTokens(decoded.userId);

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(tokens),
          };
        } catch (error) {
          return {
            statusCode: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'Invalid refresh token',
            }),
          };
        }
      }

      default:
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            message: 'Not found',
          }),
        };
    }
  } catch (error) {
    console.error('Auth error:', error);

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