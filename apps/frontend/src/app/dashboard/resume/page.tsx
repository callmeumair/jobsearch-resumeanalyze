'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ResumeUploader } from '@/components/resume/ResumeUploader';
import { toast } from 'react-hot-toast';

export default function ResumePage() {
  const { data: session } = useSession();
  const [resumeId, setResumeId] = useState<string | null>(null);

  const handleUploadComplete = async (newResumeId: string) => {
    setResumeId(newResumeId);
    // TODO: Fetch resume details and update UI
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-10 divide-y divide-gray-900/10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Resume
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Upload and manage your resume to get personalized job suggestions.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="max-w-2xl space-y-10">
                <div>
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    Upload Resume
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Upload your resume in PDF, DOC, or DOCX format. We'll analyze it
                    to provide personalized job suggestions.
                  </p>
                </div>

                <ResumeUploader onUploadComplete={handleUploadComplete} />

                {resumeId && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Resume uploaded successfully
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            Your resume has been uploaded and is being processed.
                            We'll notify you when the analysis is complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 