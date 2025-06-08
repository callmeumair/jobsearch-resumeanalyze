'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  postedAt: string;
}

interface JobFilters {
  search: string;
  location: string;
  type: string;
  experience: string;
}

const initialFilters: JobFilters = {
  search: '',
  location: '',
  type: '',
  experience: '',
};

export default function JobsPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery(
    ['jobs', filters, page],
    async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...filters,
      });

      const response = await fetch(
        `http://localhost:4000/api/jobs/search?${queryParams}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      return response.json();
    },
    {
      keepPreviousData: true,
    }
  );

  const handleFilterChange = (
    key: keyof JobFilters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-10 divide-y divide-gray-900/10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Job Search
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Find your next opportunity with personalized job suggestions.
            </p>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <Input
                    label="Search"
                    type="text"
                    placeholder="Job title, company, or keywords"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange('search', e.target.value)
                    }
                  />
                </div>

                <div className="sm:col-span-3">
                  <Input
                    label="Location"
                    type="text"
                    placeholder="City, state, or remote"
                    value={filters.location}
                    onChange={(e) =>
                      handleFilterChange('location', e.target.value)
                    }
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="">Job Type</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    value={filters.experience}
                    onChange={(e) =>
                      handleFilterChange('experience', e.target.value)
                    }
                  >
                    <option value="">Experience Level</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="text-center">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600">
              Error loading jobs. Please try again.
            </div>
          ) : (
            <div className="space-y-6">
              {data?.jobs.map((job: Job) => (
                <div
                  key={job.id}
                  className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl"
                >
                  <div className="px-4 py-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          {job.company} • {job.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{job.type}</p>
                        {job.salary && (
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {job.salary.currency}
                            {job.salary.min.toLocaleString()} -{' '}
                            {job.salary.max.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">{job.description}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Posted {new Date(job.postedAt).toLocaleDateString()}
                      </p>
                      <Button variant="primary">Apply Now</Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data?.hasMore}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(page - 1) * 10 + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(page * 10, data?.total || 0)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{data?.total || 0}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!data?.hasMore}
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 