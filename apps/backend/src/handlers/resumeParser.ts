import { SQSEvent, SQSHandler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { connectDB } from '../lib/mongodb';
import { ResumeModel } from '../models/Resume';
import { parseResume } from '../lib/resumeParser';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

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
      const message = JSON.parse(record.body) as ResumeUploadEvent;
      const { userId, resumeId, bucket, key } = message;

      // Get the resume document
      const resume = await ResumeModel.findOne({ _id: resumeId, userId });
      if (!resume) {
        console.error(`Resume not found: ${resumeId}`);
        continue;
      }

      // Update status to processing
      resume.status = 'processing';
      await resume.save();

      try {
        // Get the file from S3
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        });

        const response = await s3Client.send(getObjectCommand);
        if (!response.Body) {
          throw new Error('Empty file received from S3');
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Parse the resume
        const parsedData = await parseResume(buffer, resume.fileType);

        // Update resume with parsed data
        resume.metadata = parsedData;
        resume.status = 'completed';
        await resume.save();

        // Notify user via SNS
        await snsClient.send(
          new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Message: JSON.stringify({
              type: 'RESUME_PARSED',
              userId,
              resumeId,
              status: 'completed',
            }),
          })
        );
      } catch (error) {
        console.error('Error processing resume:', error);

        // Update resume status to failed
        resume.status = 'failed';
        await resume.save();

        // Notify user of failure
        await snsClient.send(
          new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Message: JSON.stringify({
              type: 'RESUME_PARSED',
              userId,
              resumeId,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
          })
        );
      }
    }
  } catch (error) {
    console.error('Error in resume parser worker:', error);
    throw error;
  }
}; 