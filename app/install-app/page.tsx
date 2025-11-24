'use client';

import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';

export default function InstallAppPage() {
  const handleInstall = () => {
    const appSlug = 'themis-engine';
    const url = `https://github.com/apps/${appSlug}/installations/new`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.subtle }}>
      <div className="p-8 rounded-lg shadow-lg max-w-2xl w-full" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🕸️</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Install Themis Checker App
          </h1>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            To check your repositories for compliance issues, you need to install the Themis Checker GitHub App.
          </p>
        </div>

        <div className="rounded-lg p-6 mb-6" style={{ 
          backgroundColor: `${colors.status.info}10`, 
          border: `1px solid ${colors.status.info}40` 
        }}>
          <h2 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
            Required Permissions:
          </h2>
          <ul className="space-y-2" style={{ color: colors.text.primary }}>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Contents: Read</strong> - Access repository files for compliance analysis</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Metadata: Read</strong> - Access basic repository information</span>
            </li>
          </ul>
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.status.info}40` }}>
            <p className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
              Privacy & Security:
            </p>
            <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
              <li>• Read-only access - your code is never modified</li>
              <li>• Works with both public and private repositories</li>
              <li>• Code is analyzed but never stored or used for training</li>
              <li>• No write permissions requested</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleInstall}
            variant="primary"
            className="w-full"
          >
            Install GitHub App
          </Button>
          
          <div className="text-center text-sm" style={{ color: colors.text.secondary }}>
            <p className="mb-2">Manual installation steps:</p>
            <ol className="text-left space-y-1">
              <li>1. Click the button above to go to GitHub</li>
              <li>2. Select which repositories to grant access</li>
              <li>3. Choose &quot;All repositories&quot; (recommended) or select specific ones</li>
              <li>4. Click &quot;Install&quot; and you&apos;ll be redirected back</li>
            </ol>
          </div>
          
          <div className="text-center">
            <a 
              href="/dashboard" 
              className="text-sm transition-colors"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              Skip for now (you won&apos;t be able to check repositories)
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${colors.text.secondary}33` }}>
          <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
            Repository Access:
          </h3>
          <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
            We recommend selecting <strong style={{ color: colors.text.primary }}>&quot;All repositories&quot;</strong> when installing:
          </p>
          <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
            <li>• Automatically includes new repositories</li>
            <li>• No need to manually add repositories later</li>
            <li>• Seamless compliance checking workflow</li>
            <li>• Still maintains read-only access</li>
          </ul>
          <p className="text-sm mt-3" style={{ color: colors.text.secondary }}>
            For detailed setup instructions, see the{' '}
            <a 
              href="/docs/github-app-setup.md" 
              target="_blank"
              className="underline transition-colors"
              style={{ color: colors.status.info }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.status.info}
            >
              GitHub App Setup Guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
