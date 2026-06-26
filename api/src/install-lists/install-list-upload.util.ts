import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';

export function listDocumentUploadDir(listId: number): string {
  return join(process.cwd(), 'uploads', 'install-lists', String(listId));
}

export function documentPublicPath(listId: number, storedName: string): string {
  return `/api/uploads/install-lists/${listId}/${storedName}`;
}

function uniqueName(originalName: string): string {
  const ext = extname(originalName);
  const base = basename(originalName, ext).replace(/[^\w.-]+/g, '_');
  return `${Date.now()}-${base}${ext}`;
}

export async function storeListDocument(
  listId: number,
  file: Express.Multer.File,
): Promise<{
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
}> {
  const dir = listDocumentUploadDir(listId);
  await mkdir(dir, { recursive: true });

  const originalName = file.originalname;
  const storedName = uniqueName(originalName);
  const destPath = join(dir, storedName);
  await writeFile(destPath, file.buffer);

  return {
    originalName,
    storedName,
    mimeType: file.mimetype || 'application/octet-stream',
    fileSize: file.size,
  };
}

export async function removeListDocumentFile(
  listId: number,
  storedName: string,
): Promise<void> {
  const filePath = join(listDocumentUploadDir(listId), storedName);
  try {
    await unlink(filePath);
  } catch {
    // ignore missing file
  }
}
