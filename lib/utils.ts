/**
 * Get the correct asset path
 * Ensures paths start with / for proper resolution
 */
export function getAssetPath(path: string): string {
  // If path is external, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  // Ensure path starts with /
  return path.startsWith('/') ? path : `/${path}`;
}