'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface User {
  name: string;
  email: string;
  githubId: string;
}

interface Report {
  id: string;
  status: string;
  createdAt: string;
}

interface Repo {
  id: number;
  full_name: string;
  reports?: Report[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [checkType, setCheckType] = useState('BOTH');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/user/me'),
      fetch('/api/v1/repositories')
    ])
    .then(async ([userRes, repoRes]) => {
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      const repoData = await repoRes.json();
      
      setUser(userData);
      const reposWithHistory = repoData.repositories.map((repo: Repo) => ({ ...repo, reports: [] }));
      setRepos(reposWithHistory);
      setLoading(false);

      reposWithHistory.forEach((repo: Repo) => {
        fetch(`/api/v1/repositories/${repo.id}/reports`)
          .then(res => res.json())
          .then(reports => {
            setRepos(prevRepos => prevRepos.map(
              r => r.id === repo.id ? { ...r, reports } : r
            ));
          })
          .catch(() => {});
      });
    })
    .catch(() => {
      setLoading(false);
      router.push('/login');
    });
  }, [router]);

  const handleStartCheck = (repo: Repo) => {
    setSelectedRepo(repo);
    setIsModalOpen(true);
  };

  const handleConfirmCheck = () => {
    if (!selectedRepo) return;
    setIsChecking(true);

    fetch('/api/v1/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: selectedRepo.id, checkType }),
    })
    .then(res => res.json())
    .then(results => {
        sessionStorage.setItem('check_results', JSON.stringify(results));
        setIsModalOpen(false);
        setIsChecking(false);
        router.push(`/check/${selectedRepo.id}`);
    })
    .catch(() => {
      setIsChecking(false);
      alert('Failed to start check');
    });
  };

  const handleLogout = () => {
    fetch('/api/v1/auth/logout', {
      method: 'POST',
    }).then(() => {
      router.push('/');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Themis Checker</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.name}!</span>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Repositories</h2>
        
        {repos.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No Repositories Found</h3>
            <p className="text-gray-600 mb-6">Make sure the GitHub App is installed on your repositories.</p>
            <Button onClick={() => router.push('/install-app')}>
              Install GitHub App
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {repos.map((repo) => (
              <div key={repo.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{repo.full_name}</h3>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      onChange={(e) => setCheckType(e.target.value)}
                      value={checkType}
                      className="border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="APPLE_APP_STORE">Apple App Store</option>
                      <option value="GOOGLE_PLAY_STORE">Google Play Store</option>
                      <option value="BOTH">Both Stores</option>
                    </select>
                    <Button onClick={() => handleStartCheck(repo)}>
                      Start Check
                    </Button>
                  </div>
                </div>

                {repo.reports && repo.reports.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Check History:</h4>
                    <ul className="space-y-2">
                      {repo.reports.map(report => (
                        <li key={report.id} className="text-sm text-gray-600">
                          {new Date(report.createdAt).toLocaleString()} - Status: {report.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <Modal>
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-4">Data Safety Guarantee</h2>
            <p className="text-gray-600 mb-6">
              Themis Checker needs read-only access to run compliance checks.
              Your secrets are safe; repo data will not be stored or used for training.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleConfirmCheck} disabled={isChecking}>
                {isChecking ? 'Starting...' : 'Agree and Continue'}
              </Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isChecking}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
