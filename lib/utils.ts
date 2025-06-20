/**
 * Get the correct asset path for both local development and deployment
 * Handles basePath for GitHub Pages deployment
 */
export function getAssetPath(path: string): string {
  // If path is external, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  // Get basePath from environment
  const basePath = process.env.NODE_ENV === 'production' ? '/problens-web' : '';
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Add basePath for production
  return `${basePath}${normalizedPath}`;
}