import pdfParse from 'pdf-parse';
import { parseResume as parseResumeFile } from 'resume-parser';
import { Experience, Education } from '@jobsearch-resumeanalyze/types';
import { Readable } from 'stream';
import { log } from './logger';

interface ParsedResume {
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
  summary?: string;
}

export const parseResume = async (fileStream: Readable, fileType: string) => {
  try {
    let text = '';

    if (fileType === 'application/pdf') {
      const buffer = await streamToBuffer(fileStream);
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Handle DOC/DOCX files
      // You might want to use a library like mammoth or docx for this
      throw new Error('DOC/DOCX parsing not implemented yet');
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Basic parsing logic
    const sections = text.split(/\n\s*\n/);
    const parsedData = {
      name: '',
      email: '',
      phone: '',
      summary: '',
      experience: [] as Array<{ company: string; title: string; duration: string; description: string }>,
      education: [] as Array<{ institution: string; degree: string; year: string }>,
      skills: [] as string[],
    };

    // Extract basic information
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

    for (const section of sections) {
      const lines = section.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      // Try to find email and phone
      const emailMatch = section.match(emailRegex);
      if (emailMatch) parsedData.email = emailMatch[0];

      const phoneMatch = section.match(phoneRegex);
      if (phoneMatch) parsedData.phone = phoneMatch[0];

      // Simple section detection
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('experience') || firstLine.includes('work')) {
        // Parse experience section
        // This is a very basic implementation
        const experience = {
          company: lines[1] || '',
          title: lines[2] || '',
          duration: lines[3] || '',
          description: lines.slice(4).join(' '),
        };
        parsedData.experience.push(experience);
      } else if (firstLine.includes('education')) {
        // Parse education section
        const education = {
          institution: lines[1] || '',
          degree: lines[2] || '',
          year: lines[3] || '',
        };
        parsedData.education.push(education);
      } else if (firstLine.includes('skills')) {
        // Parse skills section
        parsedData.skills = lines.slice(1).join(' ').split(/[,;]/).map(skill => skill.trim());
      } else if (!parsedData.name && lines.length > 0) {
        // Assume the first non-empty section is the name
        parsedData.name = lines[0];
      }
    }

    return parsedData;
  } catch (error) {
    log.error('Error parsing resume', error as Error);
    throw error;
  }
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const extractSkills = (text: string): string[] => {
  // Common programming languages and technologies
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Ruby',
    'PHP', 'Go', 'Rust', 'Swift', 'Kotlin', 'React', 'Angular', 'Vue',
    'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST',
    'Git', 'CI/CD', 'Agile', 'Scrum', 'DevOps', 'Linux',
  ];

  const skills: string[] = [];
  const textLower = text.toLowerCase();

  for (const skill of commonSkills) {
    if (textLower.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }

  return [...new Set(skills)]; // Remove duplicates
};

const extractExperience = (text: string): Experience[] => {
  const experience: Experience[] = [];
  const lines = text.split('\n');

  // Basic implementation - can be enhanced with NLP
  let currentExperience: Partial<Experience> = {};
  let isInExperienceSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Look for experience section headers
    if (trimmedLine.toLowerCase().includes('experience')) {
      isInExperienceSection = true;
      continue;
    }

    if (isInExperienceSection) {
      // Look for company names (usually in all caps or followed by common suffixes)
      if (/^[A-Z\s&]+(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Company|Co\.?)$/.test(trimmedLine)) {
        if (currentExperience.company) {
          experience.push(currentExperience as Experience);
        }
        currentExperience = {
          company: trimmedLine,
        };
      }
      // Look for job titles (usually followed by dates)
      else if (/\b(?:Senior|Lead|Principal|Staff|Software|Full Stack|Frontend|Backend|DevOps|Data|ML|AI|Cloud|Security)\s+(?:Engineer|Developer|Architect|Scientist|Analyst|Consultant)\b/i.test(trimmedLine)) {
        currentExperience.title = trimmedLine;
      }
      // Look for dates
      else if (/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/i.test(trimmedLine)) {
        const dates = trimmedLine.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/gi);
        if (dates) {
          currentExperience.startDate = new Date(dates[0]);
          if (dates[1]) {
            currentExperience.endDate = new Date(dates[1]);
          }
        }
      }
      // Look for descriptions
      else if (trimmedLine && !trimmedLine.match(/^[A-Z\s&]+(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Company|Co\.?)$/)) {
        if (currentExperience.description) {
          currentExperience.description += ' ' + trimmedLine;
        } else {
          currentExperience.description = trimmedLine;
        }
      }
    }
  }

  // Add the last experience
  if (currentExperience.company) {
    experience.push(currentExperience as Experience);
  }

  return experience;
};

const extractEducation = (text: string): Education[] => {
  const education: Education[] = [];
  const lines = text.split('\n');

  // Basic implementation - can be enhanced with NLP
  let currentEducation: Partial<Education> = {};
  let isInEducationSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Look for education section headers
    if (trimmedLine.toLowerCase().includes('education')) {
      isInEducationSection = true;
      continue;
    }

    if (isInEducationSection) {
      // Look for institution names (usually followed by degree)
      if (/\b(?:University|College|Institute|School)\b/i.test(trimmedLine)) {
        if (currentEducation.institution) {
          education.push(currentEducation as Education);
        }
        currentEducation = {
          institution: trimmedLine,
        };
      }
      // Look for degrees
      else if (/\b(?:Bachelor|Master|PhD|Doctorate|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|B\.?E\.?|M\.?E\.?)\b/i.test(trimmedLine)) {
        currentEducation.degree = trimmedLine;
      }
      // Look for fields of study
      else if (/\b(?:Computer Science|Engineering|Mathematics|Physics|Chemistry|Biology|Business|Economics|Psychology|Arts|Design)\b/i.test(trimmedLine)) {
        currentEducation.field = trimmedLine;
      }
      // Look for dates
      else if (/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/i.test(trimmedLine)) {
        const dates = trimmedLine.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/gi);
        if (dates) {
          currentEducation.startDate = new Date(dates[0]);
          if (dates[1]) {
            currentEducation.endDate = new Date(dates[1]);
          }
        }
      }
      // Look for GPA
      else if (/\bGPA:?\s*(\d\.\d{1,2})\b/i.test(trimmedLine)) {
        const match = trimmedLine.match(/\bGPA:?\s*(\d\.\d{1,2})\b/i);
        if (match) {
          currentEducation.gpa = parseFloat(match[1]);
        }
      }
    }
  }

  // Add the last education entry
  if (currentEducation.institution) {
    education.push(currentEducation as Education);
  }

  return education;
};

const extractSummary = (text: string): string | undefined => {
  // Look for common summary section headers
  const summaryHeaders = [
    'summary',
    'profile',
    'objective',
    'about',
    'professional summary',
  ];

  const lines = text.split('\n');
  let isInSummarySection = false;
  let summaryLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();

    // Check for summary section start
    if (summaryHeaders.some((header) => trimmedLine.includes(header))) {
      isInSummarySection = true;
      continue;
    }

    // Check for section end (empty line or new section)
    if (isInSummarySection) {
      if (!trimmedLine) {
        break;
      }
      if (trimmedLine.match(/^(?:experience|education|skills|work|projects)/i)) {
        break;
      }
      summaryLines.push(line.trim());
    }
  }

  return summaryLines.length > 0 ? summaryLines.join(' ') : undefined;
}; 