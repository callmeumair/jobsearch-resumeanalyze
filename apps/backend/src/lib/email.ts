import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { log } from './logger';

const sesClient = new SESClient({ region: process.env.AWS_REGION });

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM || 'noreply@jobsearch-resumeanalyze.com',
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
          ...(options.text && {
            Text: {
              Data: options.text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    });

    await sesClient.send(command);
    log.info('Email sent successfully', { to: options.to, subject: options.subject });
  } catch (error) {
    log.error('Failed to send email', error as Error, options);
    throw error;
  }
};

export const sendResumeParsedEmail = async (
  email: string,
  resumeId: string,
  status: 'PARSED' | 'ENHANCED' | 'FAILED'
) => {
  const templates = {
    PARSED: {
      subject: 'Your Resume Has Been Parsed Successfully',
      html: `
        <h1>Resume Processing Update</h1>
        <p>Your resume has been successfully parsed and is now being enhanced with AI.</p>
        <p>We'll notify you once the enhancement is complete.</p>
        <p>Resume ID: ${resumeId}</p>
      `,
    },
    ENHANCED: {
      subject: 'Your Resume Has Been Enhanced',
      html: `
        <h1>Resume Enhancement Complete</h1>
        <p>Your resume has been successfully enhanced with AI-generated professional summary and skills.</p>
        <p>You can now view and edit your enhanced resume in your dashboard.</p>
        <p>Resume ID: ${resumeId}</p>
      `,
    },
    FAILED: {
      subject: 'Resume Processing Failed',
      html: `
        <h1>Resume Processing Update</h1>
        <p>We encountered an error while processing your resume.</p>
        <p>Our team has been notified and will look into this issue.</p>
        <p>Please try uploading your resume again or contact support if the problem persists.</p>
        <p>Resume ID: ${resumeId}</p>
      `,
    },
  };

  const template = templates[status];
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
  });
}; 