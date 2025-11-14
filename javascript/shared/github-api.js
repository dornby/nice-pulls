/**
 * GitHub API utility functions
 */

let githubBearerToken = null;

/**
 * Loads the GitHub bearer token from secrets.json
 * @returns {Promise<string>} The bearer token
 */
async function loadGithubToken() {
  if (githubBearerToken) {
    return githubBearerToken;
  }

  const url = chrome.runtime.getURL("secrets.json");
  const response = await fetch(url);
  const json = await response.json();
  githubBearerToken = json.github_bearer_token;
  return githubBearerToken;
}

/**
 * Fetches files from a GitHub PR with pagination support
 * @param {string} pullID - The pull request ID
 * @param {number} page - The page number (1-indexed)
 * @returns {Promise<Array>} Array of file objects
 */
async function fetchPRFiles(pullID, page = 1) {
  const token = await loadGithubToken();
  const response = await fetch(
    `https://api.github.com/repos/drivy/drivy-rails/pulls/${pullID}/files?page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    }
  );
  return response.json();
}

/**
 * Fetches all files from a GitHub PR (handles pagination)
 * @param {string} pullID - The pull request ID
 * @returns {Promise<Array>} Array of all file objects
 */
async function fetchAllPRFiles(pullID) {
  let allFiles = [];
  let page = 1;
  let files;

  do {
    files = await fetchPRFiles(pullID, page);
    allFiles = allFiles.concat(files);
    page++;
  } while (files.length === 30); // GitHub returns 30 items per page

  return allFiles;
}

/**
 * Fetches commits from a GitHub PR
 * @param {string} pullID - The pull request ID
 * @returns {Promise<Array>} Array of commit objects
 */
async function fetchPRCommits(pullID) {
  const token = await loadGithubToken();
  const response = await fetch(
    `https://api.github.com/repos/drivy/drivy-rails/pulls/${pullID}/commits`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    }
  );
  return response.json();
}
