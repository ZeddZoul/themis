'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Issue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
}

interface CheckResults {
  status: string;
  summary: {
    totalIssues: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  issues: Issue[];
}

export default function CheckResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<CheckResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedResults = sessionStorage.getItem('check_results');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No results found</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Compliance Check Results</h1>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-gray-900">{results.summary.totalIssues}</div>
            <div className="text-gray-600">Total Issues</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-red-600">{results.summary.highSeverity}</div>
            <div className="text-gray-600">High Severity</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-yellow-600">{results.summary.mediumSeverity}</div>
            <div className="text-gray-600">Medium Severity</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">{results.summary.lowSeverity}</div>
            <div className="text-gray-600">Low Severity</div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Issues Found</h2>
          {results.issues.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">All Clear!</h3>
              <p className="text-gray-600">No compliance issues found in this repository.</p>
            </div>
          ) : (
            results.issues.map((issue, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-gray-600">{issue.category}</span>
                    </div>
                    {issue.file && (
                      <div className="text-sm text-gray-500 mb-2">
                        📄 {issue.file}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Issue:</h3>
                  <p className="text-gray-700">{issue.description}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">💡 Solution:</h3>
                  <p className="text-blue-800">{issue.solution}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
