import { LoginButton } from '@/components/auth/login-button';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Sign In
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Connect your GitHub account to start checking your repositories for compliance issues
        </p>
        
        <div className="mb-6">
          <LoginButton />
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold mb-2">What we need:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Read access to your repositories</li>
            <li>✓ Access to repository contents</li>
            <li>✓ Basic profile information</li>
          </ul>
          <p className="text-xs text-gray-500 mt-4">
            We only request read-only access. Your code is never stored or used for training.
          </p>
        </div>
      </div>
    </div>
  );
}
