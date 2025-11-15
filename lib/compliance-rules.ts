/**
 * Deterministic Compliance Rules Engine
 * 
 * This file defines the static, deterministic rules that form the core
 * of the compliance checking system. Each rule is evaluated consistently
 * to ensure identical inputs always yield identical outputs.
 */

export type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH';
export type Severity = 'high' | 'medium' | 'low';

export interface ComplianceRule {
  ruleId: string;
  platform: Platform;
  severity: Severity;
  category: string;
  description: string;
  checkLogic: (files: { [key: string]: string | null }) => boolean;
  staticSolution: string;
  requiredFiles?: string[];
}

/**
 * Deterministic rule checking functions
 * These functions return true if a violation is found
 */

const hasPrivacyPolicy = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = files['PRIVACY.md'] || files['privacy-policy.md'];
  
  // Check if privacy policy URL exists in README or if privacy file exists
  const hasPrivacyUrl = readme.includes('privacy') && (
    readme.includes('http://') || 
    readme.includes('https://')
  );
  
  return !hasPrivacyUrl && !privacyMd;
};

const hasDataCollectionDisclosure = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = (files['PRIVACY.md'] || files['privacy-policy.md'] || '').toLowerCase();
  
  const dataKeywords = ['data collection', 'collect data', 'user data', 'personal information'];
  const hasDisclosure = dataKeywords.some(keyword => 
    readme.includes(keyword) || privacyMd.includes(keyword)
  );
  
  return !hasDisclosure;
};

const hasAppDescription = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md'] || '';
  const appJson = files['app.json'];
  const packageJson = files['package.json'];
  
  // Check if README has substantial content (more than just title)
  const hasReadmeContent = readme.length > 100;
  
  // Check if app.json or package.json has description
  let hasJsonDescription = false;
  try {
    if (appJson) {
      const parsed = JSON.parse(appJson);
      hasJsonDescription = !!parsed.description && parsed.description.length > 20;
    }
    if (!hasJsonDescription && packageJson) {
      const parsed = JSON.parse(packageJson);
      hasJsonDescription = !!parsed.description && parsed.description.length > 20;
    }
  } catch (e) {
    // Invalid JSON
  }
  
  return !hasReadmeContent && !hasJsonDescription;
};

const hasPermissionsDocumentation = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const androidManifest = files['AndroidManifest.xml'] || '';
  const infoPlist = files['Info.plist'] || '';
  
  const hasPermissions = androidManifest.includes('permission') || infoPlist.includes('Usage');
  const hasDocumentation = readme.includes('permission') || readme.includes('access');
  
  return hasPermissions && !hasDocumentation;
};

const hasThirdPartyDisclosure = (files: { [key: string]: string | null }): boolean => {
  const packageJson = files['package.json'];
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = (files['PRIVACY.md'] || files['privacy-policy.md'] || '').toLowerCase();
  
  let hasThirdPartyDeps = false;
  try {
    if (packageJson) {
      const parsed = JSON.parse(packageJson);
      const deps = Object.keys(parsed.dependencies || {});
      // Check for common analytics/tracking SDKs
      const trackingLibs = ['firebase', 'analytics', 'mixpanel', 'amplitude', 'segment'];
      hasThirdPartyDeps = deps.some(dep => 
        trackingLibs.some(lib => dep.toLowerCase().includes(lib))
      );
    }
  } catch (e) {
    // Invalid JSON
  }
  
  const hasDisclosure = readme.includes('third-party') || 
                        readme.includes('third party') ||
                        privacyMd.includes('third-party') ||
                        privacyMd.includes('third party');
  
  return hasThirdPartyDeps && !hasDisclosure;
};

const hasContentRating = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const appJson = files['app.json'];
  
  let hasRating = false;
  try {
    if (appJson) {
      const parsed = JSON.parse(appJson);
      hasRating = !!parsed.contentRating || !!parsed.rating;
    }
  } catch (e) {
    // Invalid JSON
  }
  
  const hasRatingInReadme = readme.includes('rating') || 
                            readme.includes('age') ||
                            readme.includes('mature');
  
  return !hasRating && !hasRatingInReadme;
};

const hasDataSafetySection = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = (files['PRIVACY.md'] || files['privacy-policy.md'] || '').toLowerCase();
  
  const dataSafetyKeywords = ['data safety', 'data security', 'data protection', 'secure data'];
  const hasSafetyInfo = dataSafetyKeywords.some(keyword => 
    readme.includes(keyword) || privacyMd.includes(keyword)
  );
  
  return !hasSafetyInfo;
};

/**
 * Complete list of deterministic compliance rules
 * These rules are evaluated in order and form the source of truth
 */
export const COMPLIANCE_RULES: ComplianceRule[] = [
  // Apple App Store Rules
  {
    ruleId: 'AAS-001',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Privacy Policy',
    description: 'No publicly accessible privacy policy URL is mentioned or provided in the repository files. A privacy policy is a mandatory requirement for all apps submitted to the Apple App Store (App Store Review Guideline 5.1.1).',
    checkLogic: hasPrivacyPolicy,
    staticSolution: 'Create a comprehensive privacy policy document, host it online at a stable URL, and include this URL prominently in the app\'s metadata on App Store Connect and within the app itself. The policy should detail data collection, usage, and sharing practices.',
    requiredFiles: ['README.md', 'PRIVACY.md', 'privacy-policy.md'],
  },
  {
    ruleId: 'AAS-002',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Data Collection Disclosure',
    description: 'No explicit disclosure regarding what specific user data is collected, how it\'s used, stored, or whether any of it is transmitted off-device or shared with third parties. This detailed disclosure is required for App Store Connect\'s privacy manifest (App Store Review Guideline 5.1.1, 5.1.2).',
    checkLogic: hasDataCollectionDisclosure,
    staticSolution: 'Implement a comprehensive privacy policy that clearly outlines all data collection practices, including what data is collected, why it\'s collected, how it\'s used, whether it\'s stored locally or transmitted, and if it\'s shared with any third parties.',
    requiredFiles: ['README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'AAS-003',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'App Description',
    description: 'The app lacks a clear, comprehensive description of its functionality. App Store guidelines require accurate and detailed descriptions of app features.',
    checkLogic: hasAppDescription,
    staticSolution: 'Add a detailed description in your README.md and app.json/package.json that clearly explains what your app does, its main features, and how users interact with it.',
    requiredFiles: ['README.md', 'app.json', 'package.json'],
  },
  {
    ruleId: 'AAS-004',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Third-party SDK Disclosure',
    description: 'The app appears to use third-party SDKs or libraries but does not disclose their data collection practices. Apple requires disclosure of all third-party data collection.',
    checkLogic: hasThirdPartyDisclosure,
    staticSolution: 'Document all third-party SDKs and libraries used in your app, and disclose their data collection practices in your privacy policy.',
    requiredFiles: ['package.json', 'README.md', 'PRIVACY.md'],
  },
  
  // Google Play Store Rules
  {
    ruleId: 'GPS-001',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'Privacy Policy',
    description: 'No privacy policy link is provided. Google Play Store requires all apps that collect user data to have a publicly accessible privacy policy.',
    checkLogic: hasPrivacyPolicy,
    staticSolution: 'Create and host a privacy policy online, then add the URL to your app\'s Play Store listing and within the app itself.',
    requiredFiles: ['README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'GPS-002',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'Data Safety Section',
    description: 'Missing or incomplete Data Safety section information. Google Play requires detailed disclosure of data collection and sharing practices.',
    checkLogic: hasDataSafetySection,
    staticSolution: 'Complete the Data Safety section in Google Play Console, declaring all data collection, usage, and sharing practices. Document these practices in your repository.',
    requiredFiles: ['README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'GPS-003',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'medium',
    category: 'Permissions Documentation',
    description: 'The app requests permissions but does not clearly document why each permission is needed. Google Play guidelines require justification for all permissions.',
    checkLogic: hasPermissionsDocumentation,
    staticSolution: 'Document each permission your app requests in the README.md, explaining why it\'s necessary and how it\'s used.',
    requiredFiles: ['README.md', 'AndroidManifest.xml'],
  },
  {
    ruleId: 'GPS-004',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'medium',
    category: 'Content Rating',
    description: 'No content rating information is provided. Google Play requires all apps to have an appropriate content rating.',
    checkLogic: hasContentRating,
    staticSolution: 'Complete the content rating questionnaire in Google Play Console and document the rating in your app metadata.',
    requiredFiles: ['README.md', 'app.json'],
  },
];

/**
 * Get rules applicable to a specific platform
 */
export function getRulesForPlatform(platform: Platform): ComplianceRule[] {
  return COMPLIANCE_RULES.filter(rule => 
    rule.platform === platform || rule.platform === 'BOTH'
  );
}

/**
 * Evaluate all rules against repository files
 * Returns list of violated rules (deterministic)
 */
export function evaluateRules(
  files: { [key: string]: string | null },
  platform: Platform
): ComplianceRule[] {
  const applicableRules = getRulesForPlatform(platform);
  const violations: ComplianceRule[] = [];
  
  for (const rule of applicableRules) {
    try {
      const isViolated = rule.checkLogic(files);
      if (isViolated) {
        violations.push(rule);
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.ruleId}:`, error);
      // Continue with other rules
    }
  }
  
  return violations;
}
