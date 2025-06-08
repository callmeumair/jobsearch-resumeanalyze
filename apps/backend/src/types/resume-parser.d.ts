declare module 'resume-parser' {
  export interface ParsedResumeData {
    text: string;
    [key: string]: any;
  }

  export class ResumeParser {
    static parseResumeFile(
      buffer: Buffer,
      callback: (error: Error | null, data: ParsedResumeData) => void
    ): void;
  }
} 