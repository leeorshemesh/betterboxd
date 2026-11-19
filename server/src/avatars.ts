import { mkdirSync, unlinkSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
export const AVATAR_DIR = join(root, '..', 'data', 'avatars');

mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2_500_000;

export function avatarPublicPath(userId: string, ext: string): string {
  return `/uploads/avatars/${userId}.${ext}`;
}

export function avatarFilePath(userId: string, ext: string): string {
  return join(AVATAR_DIR, `${userId}.${ext}`);
}

export function extensionForMime(mime: string): string | null {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return null;
}

export function assertAvatarUpload(mime: string, size: number): string {
  if (!ALLOWED.has(mime)) {
    throw new Error('Avatar must be a JPEG, PNG, or WebP image');
  }
  if (size <= 0 || size > MAX_BYTES) {
    throw new Error('Avatar must be under 2.5MB');
  }
  const ext = extensionForMime(mime);
  if (!ext) throw new Error('Unsupported image type');
  return ext;
}

export function saveAvatarFile(userId: string, ext: string, bytes: Buffer): string {
  // Remove previous formats so only one file remains.
  for (const old of ['jpg', 'png', 'webp']) {
    const path = avatarFilePath(userId, old);
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {
        // ignore
      }
    }
  }
  writeFileSync(avatarFilePath(userId, ext), bytes);
  return avatarPublicPath(userId, ext);
}

export function removeAvatarFiles(userId: string): void {
  for (const ext of ['jpg', 'png', 'webp']) {
    const path = avatarFilePath(userId, ext);
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {
        // ignore
      }
    }
  }
}
