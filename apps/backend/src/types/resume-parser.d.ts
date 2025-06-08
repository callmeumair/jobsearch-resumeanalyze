declare module 'resume-parser' {
  interface WorkExperience {
    title?: string;
    company?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }

  interface Education {
    degree?: string;
    school?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  }

  interface ParsedResume {
    text: string;
    skills?: string[];
    work?: WorkExperience[];
    education?: Education[];
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  }

  export function parseResume(
    buffer: Buffer,
    fileType?: string
  ): Promise<ParsedResume>;
} 