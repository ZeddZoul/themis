'use client';

export default function InstallAppPage() {
  const handleInstall = () => {
    const appSlug = 'themis-checker';
    const url = `https://github.com/apps/${appSlug}/installations/new`;
    console.log('Redirecting to:', url);
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🕸️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Install Themis Checker App
          </h1>
          <p className="text-gray-600 mb-6">
            To check your repositories for compliance issues, you need to install the Themis Checker GitHub App.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-blue-900 mb-3">What the app needs:</h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Read access to repository contents</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Read access to repository metadata</span>
            </li>
          </ul>
          <p className="text-sm text-blue-700 mt-4">
            The app only requests read-only access. Your code is never modified, stored, or used for training.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleInstall}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Install GitHub App
          </button>
          
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Or manually install:</p>
            <ol className="text-left space-y-1">
              <li>1. Go to your GitHub App settings</li>
              <li>2. Find your Themis Checker app</li>
              <li>3. Click "Install App"</li>
              <li>4. Select repositories to check</li>
            </ol>
          </div>
          
          <div className="text-center">
            <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Skip for now (you won't be able to check repositories)
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-2">After installation:</h3>
          <ol className="text-sm text-gray-600 space-y-2">
            <li>1. Choose which repositories to give access to</li>
            <li>2. Click "Install" on GitHub</li>
            <li>3. You'll be redirected back to your dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
