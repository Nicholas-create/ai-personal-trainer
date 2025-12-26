/**
 * Script to add secrets to Firestore
 *
 * Usage:
 *   npx ts-node scripts/add-secret.ts ANTHROPIC_API_KEY "sk-ant-api03-..."
 *
 * Or run with npx tsx:
 *   npx tsx scripts/add-secret.ts ANTHROPIC_API_KEY "sk-ant-api03-..."
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function addSecret(secretName: string, secretValue: string) {
  // Parse service account from environment
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
    console.log('\nPlease add your service account JSON to .env.local:');
    console.log('FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}');
    process.exit(1);
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON');
    process.exit(1);
  }

  // Initialize Firebase Admin
  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  const db = getFirestore(app);

  try {
    // Add the secret to Firestore
    await db.collection('secrets').doc(secretName).set({
      value: secretValue,
      updatedAt: new Date(),
    });

    console.log(`✅ Secret "${secretName}" added to Firestore successfully!`);
    console.log(`   Collection: secrets`);
    console.log(`   Document: ${secretName}`);
  } catch (error) {
    console.error('❌ Failed to add secret:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Get arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: npx tsx scripts/add-secret.ts <SECRET_NAME> <SECRET_VALUE>');
  console.log('');
  console.log('Example:');
  console.log('  npx tsx scripts/add-secret.ts ANTHROPIC_API_KEY "sk-ant-api03-..."');
  process.exit(1);
}

const [secretName, secretValue] = args;
addSecret(secretName, secretValue);
