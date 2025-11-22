import { LoginButton } from '@/components/auth/login-button';
import { colors } from '@/lib/design-system';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: colors.background.subtle }}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl"
          style={{ backgroundColor: colors.primary.accent }}
        />
        <div 
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: colors.status.info }}
        />
      </div>

      <div className="relative z-10 p-8 rounded-lg shadow-lg max-w-md w-full border" style={{ 
        backgroundColor: colors.background.main,
        borderColor: colors.text.secondary + '20'
      }}>
        {/* Themis Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/icon.png"
              alt="Themis Logo"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
            Welcome to Themis
          </h1>
          <p className="text-lg font-medium mb-4" style={{ color: colors.primary.accent }}>
            Mobile App Compliance
          </p>
        </div>

      
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
