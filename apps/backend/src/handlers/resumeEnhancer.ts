import { SQSEvent, SQSHandler } from 'aws-lambda';
import { connectDB } from '../lib/mongodb';
import { ResumeModel } from '../models/Resume';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ResumeEnhancementEvent {
  userId: string;
  resumeId: string;
  parsedData: {
    skills?: string[];
    experience?: Array<{
      title: string;
      company: string;
      description: string;
      startDate: string;
      endDate?: string;
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      field: string;
      graduationDate: string;
    }>;
  };
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  try {
    await connectDB();

    for (const record of event.Records) {
      const message: ResumeEnhancementEvent = JSON.parse(record.body);
      console.log('Processing resume enhancement:', message);

      const { userId, resumeId, parsedData } = message;

      // Prepare context for OpenAI
      const experienceText = parsedData.experience
        ?.map(
          (exp) =>
            `${exp.title} at ${exp.company} (${exp.startDate} - ${
              exp.endDate || 'Present'
            }): ${exp.description}`
        )
        .join('\n');

      const educationText = parsedData.education
        ?.map(
          (edu) =>
            `${edu.degree} in ${edu.field} from ${edu.institution} (Graduated: ${edu.graduationDate})`
        )
        .join('\n');

      const skillsText = parsedData.skills?.join(', ');

      const prompt = `Given the following professional experience, education, and skills, generate:
1. A compelling professional summary (2-3 sentences)
2. A list of top 5-7 most relevant and impressive skills

Experience:
${experienceText || 'No experience provided'}

Education:
${educationText || 'No education provided'}

Skills:
${skillsText || 'No skills provided'}

Format the response as JSON with two fields:
{
  "summary": "professional summary here",
  "topSkills": ["skill1", "skill2", ...]
}`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional resume writer and career coach. Generate concise, impactful professional summaries and identify the most relevant skills based on the provided information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const enhancement = JSON.parse(completion.choices[0].message.content);

      // Update resume in MongoDB
      await ResumeModel.findByIdAndUpdate(
        resumeId,
        {
          $set: {
            'metadata.summary': enhancement.summary,
            'metadata.topSkills': enhancement.topSkills,
            status: 'ENHANCED',
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      console.log('Resume enhanced successfully:', resumeId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Resume enhancement completed' }),
    };
  } catch (error) {
    console.error('Error enhancing resume:', error);
    throw error;
  }
}; 