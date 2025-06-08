import { SQSHandler, SQSBatchResponse } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { log } from '../lib/logger';
import { Resume } from '../models/Resume';
import { connect as connectRabbitMQ } from '../lib/rabbitmq';

const sqs = new SQS();

export const handler: SQSHandler = async (event): Promise<void | SQSBatchResponse> => {
  try {
    // Connect to RabbitMQ
    await connectRabbitMQ();

    const batchItemFailures: { itemIdentifier: string }[] = [];

    for (const record of event.Records) {
      try {
        const { resumeId, userId } = JSON.parse(record.body);

        // Update resume status to ENHANCING
        const resume = await Resume.findById(resumeId);
        if (!resume) {
          log.error('Resume not found', { resumeId });
          batchItemFailures.push({ itemIdentifier: record.messageId });
          continue;
        }

        if (resume.userId.toString() !== userId) {
          log.error('User does not have access to this resume', { resumeId, userId });
          batchItemFailures.push({ itemIdentifier: record.messageId });
          continue;
        }

        resume.status = 'ENHANCING';
        await resume.save();

        // Get parsed data
        const parsedData = resume.parsedData;
        if (!parsedData) {
          throw new Error('No parsed data available for enhancement');
        }

        // Enhance the resume data
        const enhancedData = await enhanceResumeData(parsedData);

        // Update resume with enhanced data
        resume.enhancedData = enhancedData;
        resume.status = 'ENHANCED';
        await resume.save();

        // Send notification email
        // TODO: Implement email notification

        log.info('Resume enhanced successfully', { resumeId });
      } catch (error) {
        log.error('Failed to process record', { recordId: record.messageId, error });
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }

    if (batchItemFailures.length > 0) {
      return { batchItemFailures };
    }
  } catch (error) {
    log.error('Error in resume enhancer handler', error as Error);
    throw error;
  }
};

async function enhanceResumeData(parsedData: NonNullable<typeof Resume.prototype.parsedData>) {
  // TODO: Implement actual enhancement logic using AI/ML
  // For now, return a simple enhancement
  return {
    summary: parsedData.summary ? `${parsedData.summary}\n\nEnhanced with AI-powered insights.` : undefined,
    experience: parsedData.experience?.map(exp => ({
      ...exp,
      enhancedDescription: `${exp.description}\n\nEnhanced with AI-powered insights.`,
    })),
    skills: parsedData.skills?.map(skill => ({
      name: skill,
      level: 'Intermediate', // This should be determined by AI
      category: 'Technical', // This should be determined by AI
    })),
  };
} 