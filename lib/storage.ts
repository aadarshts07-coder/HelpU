import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'screenshots');
const RESUME_DIR = path.join(process.cwd(), 'public', 'resumes');

function ensureDirectories() {
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    if (!fs.existsSync(RESUME_DIR)) {
      fs.mkdirSync(RESUME_DIR, { recursive: true });
    }
  } catch (e) {
    // Read-only filesystem in serverless environments
  }
}

/**
 * Saves a screenshot buffer to the public directory and returns the accessible URL
 */
export async function saveScreenshot(buffer: Buffer, applicationId: string, stepName: string): Promise<string> {
  ensureDirectories();
  const timestamp = Date.now();
  const cleanStep = stepName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${applicationId}_${cleanStep}_${timestamp}.png`;
  const filePath = path.join(SCREENSHOT_DIR, filename);

  try {
    fs.writeFileSync(filePath, buffer);
    return `/screenshots/${filename}`;
  } catch (err) {
    console.warn('[Storage] Screenshot file write skipped (using base64 inline):', err);
    // Return base64 as fallback
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }
}

/**
 * Saves generated resume (PDF or DOCX) to the public/resumes directory
 */
export async function saveResumeFile(buffer: Buffer, filename: string): Promise<string> {
  ensureDirectories();
  const filePath = path.join(RESUME_DIR, filename);
  try {
    fs.writeFileSync(filePath, buffer);
  } catch (err) {
    console.warn('[Storage] Resume file write skipped (serverless environment):', err);
  }
  return `/resumes/${filename}`;
}
