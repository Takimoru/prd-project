/**
 * File Migration Script from Convex Storage
 * Per PRD Task A4: Implement file migration script
 * Downloads files from Convex storage and uploads to local/S3 storage
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { AppDataSource } from '../data-source';

interface FileMapping {
  convexUrl: string;
  convexStorageId?: string;
  newUrl: string;
  fileName: string;
  fileType: string;
  downloadedAt: Date;
}

const fileMappings: FileMapping[] = [];

/**
 * Ensure uploads directory exists
 */
function ensureUploadDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created upload directory: ${dir}`);
  }
}

/**
 * Download file from URL
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(outputPath);
      reject(err);
    });
  });
}

/**
 * Extract filename from URL or storage ID
 */
function generateFileName(url: string, storageId?: string): string {
  if (storageId) {
    return storageId;
  }
  
  const urlPath = new URL(url).pathname;
  return path.basename(urlPath);
}

/**
 * Migrate files from Convex manifest
 */
async function migrateFilesFromManifest(manifestPath: string, uploadDir: string): Promise<void> {
  console.log('📁 Starting file migration from Convex...\n');
  
  ensureUploadDir(uploadDir);
  
  // Load file manifest
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifest file not found:', manifestPath);
    console.log('📝 Please create a manifest file with the following format:');
    console.log(`[
  {
    "url": "https://convex-cloud.com/api/storage/...",
    "storageId": "kg2...",
    "type": "payment-proof",
    "relatedEntity": "registration_123"
  }
]`);
    return;
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`📋 Found ${manifest.length} files to migrate\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const fileEntry of manifest) {
    try {
      const { url, storageId, type } = fileEntry;
      const fileName = generateFileName(url, storageId);
      const outputPath = path.join(uploadDir, fileName);
      
      console.log(`⬇️  Downloading: ${fileName}...`);
      await downloadFile(url, outputPath);
      
      const newUrl = `/uploads/${fileName}`;
      
      fileMappings.push({
        convexUrl: url,
        convexStorageId: storageId,
        newUrl: newUrl,
        fileName: fileName,
        fileType: type || 'unknown',
        downloadedAt: new Date(),
      });
      
      successCount++;
      console.log(`   ✓ Saved to: ${outputPath}`);
    } catch (error) {
      failCount++;
      console.error(`   ✗ Failed to download:`, error);
    }
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  
  // Save file mappings
  const mappingFile = path.join(path.dirname(manifestPath), 'file_mappings.json');
  fs.writeFileSync(mappingFile, JSON.stringify(fileMappings, null, 2));
  console.log(`\n💾 Saved file mappings to: ${mappingFile}`);
}

/**
 * Update database with new file URLs
 */
async function updateDatabaseUrls(mappingsPath: string): Promise<void> {
  console.log('\n🔄 Updating database with new file URLs...');
  
  if (!fs.existsSync(mappingsPath)) {
    console.error('❌ Mappings file not found:', mappingsPath);
    return;
  }
  
  await AppDataSource.initialize();
  
  const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));
  
  // Update Registration payment proof URLs
  const registrationRepo = AppDataSource.getRepository('Registration');
  for (const mapping of mappings.filter((m: FileMapping) => m.fileType === 'payment-proof')) {
    try {
      await registrationRepo
        .createQueryBuilder()
        .update()
        .set({ paymentProofUrl: mapping.newUrl })
        .where('paymentProofUrl = :oldUrl', { oldUrl: mapping.convexUrl })
        .execute();
      
      console.log(`  ✓ Updated registration payment proof URL`);
    } catch (error) {
      console.error(`  ✗ Failed to update:`, error);
    }
  }
  
  // Update Team documentation URLs
  const teamRepo = AppDataSource.getRepository('Team');
  const teams = await teamRepo.find();
  
  for (const team of teams) {
    if (team.documentation && Array.isArray(team.documentation)) {
      let updated = false;
      
      team.documentation = team.documentation.map((doc: any) => {
        const mapping = mappings.find((m: FileMapping) => m.convexUrl === doc.url);
        if (mapping) {
          updated = true;
          return { ...doc, url: mapping.newUrl };
        }
        return doc;
      });
      
      if (updated) {
        await teamRepo.save(team);
        console.log(`  ✓ Updated team ${team.id} documentation URLs`);
      }
    }
  }
  
  await AppDataSource.destroy();
  console.log('\n✅ Database URLs updated!');
}

/**
 * Main migration workflow
 */
async function migrateFiles() {
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  const manifestPath = process.argv[2] || './convex-export/files_manifest.json';
  const updateDb = process.argv.includes('--update-db');
  
  console.log('🚀 File Migration Tool\n');
  console.log(`Upload directory: ${uploadDir}`);
  console.log(`Manifest path: ${manifestPath}\n`);
  
  // Step 1: Download files
  await migrateFilesFromManifest(manifestPath, uploadDir);
  
  // Step 2: Update database (optional)
  if (updateDb) {
    const mappingsPath = path.join(path.dirname(manifestPath), 'file_mappings.json');
    await updateDatabaseUrls(mappingsPath);
  } else {
    console.log('\n💡 Tip: Run with --update-db flag to update database URLs automatically');
  }
}

// Run if called directly
if (require.main === module) {
  migrateFiles().catch(console.error);
}

export { migrateFiles, fileMappings };


