import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const GITHUB_REPO = process.env.GITHUB_REPO || 'mukminn/DEWA-MINI-APP';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

async function initGit() {
  try {
    execSync('git init', { stdio: 'inherit' });
    console.log('✓ Git initialized');
  } catch (error) {
    console.log('Git already initialized');
  }
}

async function addFiles() {
  try {
    execSync('git add .', { stdio: 'inherit' });
    console.log('✓ Files staged');
  } catch (error) {
    console.error('Error staging files:', error);
    throw error;
  }
}

async function commit() {
  try {
    execSync('git commit -m "Initial commit: DEWA Web3 DApp"', { stdio: 'inherit' });
    console.log('✓ Files committed');
  } catch (error) {
    console.error('Error committing:', error);
    throw error;
  }
}

async function setRemote() {
  try {
    execSync(`git remote remove origin`, { stdio: 'ignore' });
  } catch (error) {
    // Remote doesn't exist, continue
  }

  const repoUrl = GITHUB_TOKEN
    ? `https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`
    : `https://github.com/${GITHUB_REPO}.git`;

  try {
    execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
    console.log('✓ Remote added');
  } catch (error) {
    console.error('Error setting remote:', error);
    throw error;
  }
}

async function push() {
  try {
    execSync('git branch -M main', { stdio: 'inherit' });
    execSync('git push -u origin main --force', { stdio: 'inherit' });
    console.log('✓ Pushed to GitHub');
  } catch (error) {
    console.error('Error pushing:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting GitHub push...\n');

  try {
    await initGit();
    await addFiles();
    await commit();
    await setRemote();
    await push();

    console.log('\n✅ Successfully pushed to GitHub!');
    console.log(`📦 Repository: https://github.com/${GITHUB_REPO}`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();


