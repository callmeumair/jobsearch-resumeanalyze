import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { connectDB } from './mongodb';
import { UserModel } from '../models/User';

interface JWTPayload {
  userId: string;
}

export const verifyToken = async (
  event: APIGatewayProxyEvent
): Promise<{ id: string; email: string } | null> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    await connectDB();
    const user = await UserModel.findById(decoded.userId).select('id email');
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}; 