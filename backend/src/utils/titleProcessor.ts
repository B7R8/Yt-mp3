import { decode } from 'html-entities';

export function processVideoTitle(rawTitle: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return 'Unknown Video';
  }

  try {
    let processedTitle = rawTitle;

    // Decode HTML entities
    if (/&[a-zA-Z0-9#]+;/.test(processedTitle)) {
      processedTitle = decode(processedTitle, { level: 'html5' });
    }

    // Remove control characters
    processedTitle = processedTitle.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    if (processedTitle.startsWith('  ') || processedTitle.endsWith('  ')) {
      processedTitle = processedTitle.trim();
    }

    if (!processedTitle || processedTitle.length === 0) {
      return 'Unknown Video';
    }

    return processedTitle;
  } catch (error) {
    console.warn('Error processing video title:', error);
    return rawTitle || 'Unknown Video';
  }
}

export function preserveExactTitle(rawTitle: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return 'Unknown Video';
  }

  if (rawTitle.trim().length === 0) {
    return 'Unknown Video';
  }

  return rawTitle;
}

export function isValidTitle(title: string): boolean {
  if (!title || typeof title !== 'string') {
    return false;
  }

  if (title.trim().length === 0) {
    return false;
  }

  try {
    const encoded = encodeURIComponent(title);
    const decoded = decodeURIComponent(encoded);
    return decoded === title;
  } catch (error) {
    return false;
  }
}