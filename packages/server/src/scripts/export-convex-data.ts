/**
 * Export data from Convex to JSON files
 * Per PRD: Inventory & Deep Learn - extract Convex collections
 * 
 * This script connects to Convex and exports all collections to JSON files
 * Usage: CONVEX_URL=<your-url> CONVEX_DEPLOY_KEY=<key> npm run export-convex
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * NOTE: This is a template script. To actually export from Convex, you need to:
 * 1. Install @convex-dev/server npm package
 * 2. Use Convex client to query collections
 * 3. Or manually export via Convex dashboard
 * 
 * For now, this provides the structure for manual exports.
 */

interface ConvexExportConfig {
  outputDir: string;
  collections: string[];
}

const config: ConvexExportConfig = {
  outputDir: process.env.CONVEX_EXPORT_DIR || './convex-export',
  collections: [
    'users',
    'programs',
    'teams',
    'registrations',
    'attendance',
    'work_programs',
    'work_program_progress',
    'tasks',
    'task_updates',
    'weeklyReports',
    'weeklyTasks',
    'activities',
    'weekly_attendance_approvals',
  ],
};

/**
 * Create export directory if it doesn't exist
 */
function ensureExportDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created export directory: ${dir}`);
  }
}

/**
 * Export sample template for manual export
 */
function createExportTemplates(dir: string, collections: string[]): void {
  console.log('\n📋 Creating export templates...');
  
  for (const collection of collections) {
    const templatePath = path.join(dir, `${collection}.json`);
    if (!fs.existsSync(templatePath)) {
      fs.writeFileSync(templatePath, JSON.stringify([], null, 2));
      console.log(`  ✓ Created template: ${collection}.json`);
    }
  }
}

/**
 * Instructions for manual export
 */
function printInstructions(dir: string): void {
  console.log('\n' + '='.repeat(70));
  console.log('📚 CONVEX EXPORT INSTRUCTIONS');
  console.log('='.repeat(70));
  console.log('\nTo export your Convex data, follow these steps:\n');
  console.log('Option 1: Manual Export via Convex Dashboard');
  console.log('  1. Go to your Convex dashboard');
  console.log('  2. Navigate to the Data tab');
  console.log('  3. For each collection, click Export and save as JSON');
  console.log(`  4. Place the exported files in: ${path.resolve(dir)}`);
  console.log('\nOption 2: Programmatic Export (requires Convex SDK)');
  console.log('  1. Install: npm install @convex-dev/server');
  console.log('  2. Use ConvexHttpClient to query each collection');
  console.log('  3. Save results to JSON files');
  console.log('\nOption 3: Use Convex CLI');
  console.log('  npx convex export --path ./convex-export');
  console.log('\nRequired files:');
  config.collections.forEach(collection => {
    console.log(`  - ${collection}.json`);
  });
  console.log('\nAfter exporting, run the migration:');
  console.log('  npm run migrate:from-convex');
  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Sample data generator for testing migration without actual Convex data
 */
function generateSampleData(dir: string): void {
  console.log('\n🔧 Generating sample data for testing...');
  
  // Sample user
  const users = [
    {
      _id: 'user_1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      googleId: 'google_admin_1',
      studentId: null,
    },
    {
      _id: 'user_2',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
      googleId: 'google_john_1',
      studentId: 'STU001',
    },
  ];

  // Sample program
  const programs = [
    {
      _id: 'prog_1',
      title: 'Field Study 2024',
      description: 'Annual field study program',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      archived: false,
      createdBy: 'user_1',
    },
  ];

  // Sample team
  const teams = [
    {
      _id: 'team_1',
      programId: 'prog_1',
      leaderId: 'user_2',
      memberIds: ['user_2'],
      name: 'Team Alpha',
      progress: 0,
    },
  ];

  const sampleData: Record<string, any[]> = {
    users,
    programs,
    teams,
    registrations: [],
    attendance: [],
    work_programs: [],
    work_program_progress: [],
    tasks: [],
    task_updates: [],
    weeklyReports: [],
    weeklyTasks: [],
    activities: [],
    weekly_attendance_approvals: [],
  };

  for (const [collection, data] of Object.entries(sampleData)) {
    const filePath = path.join(dir, `${collection}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ✓ Generated sample: ${collection}.json (${data.length} records)`);
  }

  console.log('\n✅ Sample data generated for testing migration');
}

/**
 * Main export function
 */
async function exportConvexData() {
  console.log('🚀 Convex Data Export Tool\n');

  const { outputDir, collections } = config;

  // Ensure export directory exists
  ensureExportDir(outputDir);

  // Create templates
  createExportTemplates(outputDir, collections);

  // Print instructions
  printInstructions(outputDir);

  // Optionally generate sample data for testing
  if (process.argv.includes('--sample')) {
    generateSampleData(outputDir);
  }
}

// Run if called directly
if (require.main === module) {
  exportConvexData().catch(console.error);
}

export { exportConvexData, config };


