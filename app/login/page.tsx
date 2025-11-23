import { LoginButton } from '@/components/auth/login-button';
import { colors } from '@/lib/design-system';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.subtle }}>
      <div className="p-8 rounded-lg shadow-lg max-w-md w-full" style={{ backgroundColor: colors.background.main }}>
        <h1 className="text-3xl font-bold mb-4 text-center" style={{ color: colors.text.primary }}>
          Sign In
        </h1>
        <p className="mb-8 text-center" style={{ color: colors.text.secondary }}>
          Connect your GitHub account to start checking your repositories for compliance issues
        </p>
        
        <div className="mb-6">
          <LoginButton />
        </div>

        <div className="pt-6" style={{ borderTop: `1px solid ${colors.text.secondary}33` }}>
          <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
            What we need:
          </h3>
          <ul className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
            <li>✓ Read access to your repositories</li>
            <li>✓ Access to repository contents</li>
            <li>✓ Basic profile information</li>
          </ul>
          <p className="text-xs mt-4" style={{ color: colors.text.secondary, opacity: 0.8 }}>
            We only request read-only access. Your code is never stored or used for training.
          </p>
        </div>
      </div>
    </div>
  );
}
