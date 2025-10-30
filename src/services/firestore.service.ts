import * as admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
// These are assumed to be globally available at runtime as per the project specification.
// In a real-world application, these would be securely injected via environment variables
// or a secret management service.
declare const __app_id: string;
declare const __firebase_config: admin.ServiceAccount;

try {
  admin.initializeApp({
    credential: admin.credential.cert(__firebase_config),
    databaseURL: `https://${__app_id}.firebaseio.com`,
  });
} catch (error) {
  // Prevent crashing during hot-reloads in development environments
  if (!/already exists/.test((error as Error).message)) {
    console.error('Firebase Admin SDK initialization error:', error);
    // In a production environment, you might want to exit the process
    // process.exit(1);
  }
}

const db = admin.firestore();
console.log('Firestore service initialized.');

// --- Interfaces ---

export interface ComplianceRule {
  id: string;
  guideline_id: string;
  name: string;
  description: string;
  rule_text: string;
  target_files: string[];
}

export interface ComplianceReport {
  app_status: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'UNKNOWN';
  risk_score: number;
  issues: {
    guideline_id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    file_path: string;
    line_number?: number;
    violation_summary: string;
    actionable_fix: string;
  }[];
}

// --- Service Functions ---

/**
 * Fetches all compliance rules from the central Firestore collection.
 * @returns {Promise<ComplianceRule[]>} A promise that resolves to an array of compliance rules.
 */
export const fetchComplianceRules = async (): Promise<ComplianceRule[]> => {
  const rulesCollection = '/global/minosguard/compliance_rules';
  const snapshot = await db.collection(rulesCollection).get();

  if (snapshot.empty) {
    console.warn(`Warning: No compliance rules found in Firestore at '${rulesCollection}'. The analysis will be limited.`);
    return [];
  }

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ComplianceRule));
};

/**
 * Saves a compliance analysis report to Firestore.
 * @param {string} appId The application ID.
 *- * @param {string} userId The user ID associated with the scan.
 * @param {string} reportId The unique ID for the report (typically the jobId).
 * @param {ComplianceReport} reportData The report data to save.
 */
export const saveComplianceReport = async (
  appId: string,
  userId: string,
  reportId: string,
  reportData: ComplianceReport
): Promise<void> => {
  const reportPath = `/artifacts/${appId}/users/${userId}/compliance_reports/${reportId}`;
  const docRef = db.doc(reportPath);

  await docRef.set({
    ...reportData,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    jobId: reportId,
  });

  console.log(`Compliance report ${reportId} saved to Firestore at path: ${reportPath}`);
};
