import { execSync } from 'child_process';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const VERCEL_PROJECT_NAME = process.env.VERCEL_PROJECT_NAME || 'dewa-mini-app';

async function deploy() {
  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    console.log('🚀 Deploying to Vercel...\n');

    // Login to Vercel
    execSync(`vercel login ${VERCEL_TOKEN}`, { stdio: 'inherit' });

    // Deploy
    execSync(`vercel --prod --token ${VERCEL_TOKEN}`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        VERCEL_TOKEN,
      },
    });

    console.log('\n✅ Successfully deployed to Vercel!');
  } catch (error) {
    console.error('\n❌ Deployment error:', error);
    process.exit(1);
  }
}

deploy();

