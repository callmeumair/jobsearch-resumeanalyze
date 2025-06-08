import { SQSEvent, SQSHandler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { connectDB } from '../lib/mongodb';
import { ResumeModel } from '../models/Resume';
import { parseResume } from '../lib/resumeParser';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Readable } from 'stream';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

interface ResumeUploadEvent {
  userId: string;
  resumeId: string;
  bucket: string;
  key: string;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  try {
    await connectDB();

    for (const record of event.Records) {
      const message: ResumeUploadEvent = JSON.parse(record.body);
      console.log('Processing resume:', message);

      const { userId, resumeId, bucket, key } = message;

      // Get resume from database to check file type
      const resume = await ResumeModel.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      // Get file from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(getObjectCommand);
      if (!response.Body) {
        throw new Error('No file content received from S3');
      }

      // Convert S3 stream to Node.js Readable
      const stream = response.Body as unknown as Readable;

      // Parse resume with file type
      const parsedData = await parseResume(stream, resume.fileType);

      // Update resume status to PARSED
      await ResumeModel.findByIdAndUpdate(
        resumeId,
        {
          $set: {
            'metadata.skills': parsedData.skills,
            'metadata.experience': parsedData.experience,
            'metadata.education': parsedData.education,
            status: 'PARSED',
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      // Send to enhancement queue
      const enhanceMessage = {
        userId,
        resumeId,
        parsedData,
      };

      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: process.env.RESUME_ENHANCE_QUEUE_URL,
          MessageBody: JSON.stringify(enhanceMessage),
        })
      );

      // Notify user via SNS
      await snsClient.send(
        new PublishCommand({
          TopicArn: process.env.RESUME_NOTIFICATION_TOPIC_ARN,
          Message: JSON.stringify({
            userId,
            resumeId,
            status: 'PARSED',
            message: 'Your resume has been parsed successfully. AI enhancement in progress.',
          }),
        })
      );

      console.log('Resume processed successfully:', resumeId);
    }
  } catch (error) {
    console.error('Error processing resume:', error);
    throw error;
  }
}; 