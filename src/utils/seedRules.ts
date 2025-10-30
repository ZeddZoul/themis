import * as admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
// This script assumes it's run in an environment where the global variables
// are available, or it could be modified to use a service account file directly.
declare const __app_id: string;
declare const __firebase_config: admin.ServiceAccount;

try {
  admin.initializeApp({
    credential: admin.credential.cert(__firebase_config),
    databaseURL: `https://${__app_id}.firebaseio.com`,
  });
} catch (error) {
  if (!/already exists/.test((error as Error).message)) {
    console.error('Firebase Admin SDK initialization error:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

// --- Rule Definitions ---

const initialRules = [
  {
    id: 'apple-5.1.1',
    guideline_id: 'Apple 5.1.1 (Data Collection and Storage)',
    name: 'Privacy - Data Collection and Storage',
    description: 'Apps must get user consent for the collection of personal data and provide a clear privacy policy.',
    rule_text: 'You must explicitly state in your app\'s privacy policy and request user consent before collecting any user data. Specifically, check for the presence of the NSLocationWhenInUseUsageDescription key in Info.plist if the app appears to use location services.',
    target_files: ['Info.plist', 'privacy.md', 'PRIVACY.md'],
  },
  {
    id: 'google-privacy-policy',
    guideline_id: 'Google Play (Privacy Policy)',
    name: 'Privacy Policy Requirements',
    description: 'Your app must have a comprehensive privacy policy that discloses how your app collects, uses, and shares user data.',
    rule_text: 'A valid privacy policy link must be present in the app store listing and the app itself. The policy must cover data handling, retention, and security practices. Check for a privacy policy file (privacy.md, privacy.txt) and review its contents for completeness.',
    target_files: ['privacy.md', 'PRIVACY.md', 'privacy.txt'],
  },
];

// --- Seeding Logic ---

const seedRules = async () => {
  const rulesCollectionPath = `/global/${__app_id}/compliance_rules`;
  const rulesCollection = db.collection(rulesCollectionPath);
  console.log(`Starting to seed compliance rules to: ${rulesCollectionPath}`);

  const batch = db.batch();

  for (const rule of initialRules) {
    const docRef = rulesCollection.doc(rule.id);
    batch.set(docRef, rule);
  }

  try {
    await batch.commit();
    console.log(`Successfully seeded ${initialRules.length} compliance rules.`);
  } catch (error) {
    console.error('Error seeding rules:', error);
    process.exit(1);
  }
};

seedRules().then(() => {
  console.log('Seeding complete. Exiting.');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error during seeding:', err);
  process.exit(1);
});
