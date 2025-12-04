/**
 * Download a file from a URL
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || extractFilenameFromUrl(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download file. Please try again.');
  }
}

/**
 * Extract filename from URL
 */
function extractFilenameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || 'download';
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  return mimeMap[mimeType] || 'bin';
}
