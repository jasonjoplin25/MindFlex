/**
 * Utility functions for handling images in the application
 */

/**
 * Get the correct URL for an image, adjusting for GitHub Pages if needed
 * 
 * @param {string} path - The relative path to the image
 * @returns {string} - The corrected URL for the current environment
 */
export const getImageUrl = (path) => {
  // For GitHub Pages, we need to ensure paths are properly formed
  // If the app is running on GitHub Pages, prepend the repo name to the path
  const isGitHubPages = window.location.hostname.includes('github.io');
  const repoName = 'MindFlex';
  
  if (isGitHubPages) {
    // Make sure path starts with slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `/${repoName}${normalizedPath}`;
  }
  
  return path;
};

const imageUtils = {
  getImageUrl
};

export default imageUtils; 