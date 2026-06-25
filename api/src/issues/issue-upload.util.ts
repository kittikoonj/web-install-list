import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { createWriteStream } from 'fs';
import { Issue } from '../entities/issue.entity';
import { IssueAttachment } from '../entities/issue-attachment.entity';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
]);

export function isImageFile(mimeType: string, filename: string): boolean {
  if (mimeType.startsWith('image/')) return true;
  return IMAGE_EXTENSIONS.has(extname(filename).toLowerCase());
}

export function issueUploadDir(issueId: number): string {
  return join(process.cwd(), 'uploads', 'issues', String(issueId));
}

export function attachmentPublicPath(issueId: number, storedName: string): string {
  return `/api/uploads/issues/${issueId}/${storedName}`;
}

function uniqueName(originalName: string): string {
  const ext = extname(originalName);
  const base = basename(originalName, ext).replace(/[^\w.-]+/g, '_');
  return `${Date.now()}-${base}${ext}`;
}

async function zipBuffer(
  buffer: Buffer,
  entryName: string,
  destPath: string,
): Promise<void> {
  const { ZipArchive } = await import('archiver');

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(destPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);
    archive.append(buffer, { name: entryName });
    archive.finalize();
  });
}

export async function storeIssueAttachment(
  issueId: number,
  file: Express.Multer.File,
): Promise<{
  originalName: string;
  storedName: string;
  mimeType: string;
  fileType: 'image' | 'file';
  fileSize: number;
}> {
  const dir = issueUploadDir(issueId);
  await mkdir(dir, { recursive: true });

  const originalName = file.originalname;
  const image = isImageFile(file.mimetype, originalName);

  if (image) {
    const storedName = uniqueName(originalName);
    const destPath = join(dir, storedName);
    await writeFile(destPath, file.buffer);
    return {
      originalName,
      storedName,
      mimeType: file.mimetype,
      fileType: 'image',
      fileSize: file.size,
    };
  }

  const zipBase = basename(originalName, extname(originalName)).replace(
    /[^\w.-]+/g,
    '_',
  );
  const storedName = `${Date.now()}-${zipBase}.zip`;
  const destPath = join(dir, storedName);
  await zipBuffer(file.buffer, originalName, destPath);

  return {
    originalName,
    storedName,
    mimeType: 'application/zip',
    fileType: 'file',
    fileSize: file.size,
  };
}

export async function removeStoredFile(
  issueId: number,
  storedName: string,
): Promise<void> {
  const filePath = join(issueUploadDir(issueId), storedName);
  try {
    await unlink(filePath);
  } catch {
    // ignore missing file
  }
}

export function withAttachmentUrls(issue: Issue): Issue & {
  attachments: Array<IssueAttachment & { url: string }>;
} {
  const attachments = (issue.attachments ?? []).map((att) => ({
    ...att,
    url: attachmentPublicPath(att.issueId, att.storedName),
  }));
  return { ...issue, attachments };
}
