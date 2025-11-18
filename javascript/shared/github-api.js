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

  if (typeof chrome === 'undefined' || !chrome.runtime) {
    throw new Error("Chrome extension runtime not available. Please reload the page.");
  }

  const url = chrome.runtime.getURL("secrets.json");
  const response = await fetch(url);
  const json = await response.json();
  githubBearerToken = json.github_bearer_token;
  return githubBearerToken;
}

/**
 * Gets the current authenticated user
 * @returns {Promise<Object>} The user object with login, name, etc.
 */
async function getCurrentUser() {
  const token = await loadGithubToken();
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return response.json();
}

/**
 * Makes an authenticated API call to GitHub
 * @param {string} endpoint - API endpoint (e.g., '/pulls/123/files')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The JSON response
 */
async function githubApiCall(endpoint, options = {}) {
  const token = await loadGithubToken();
  const url = endpoint.startsWith("http") ? endpoint : `${GITHUB_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API call failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches files from a GitHub PR with pagination support
 * @param {string} pullID - The pull request ID
 * @param {number} page - The page number (1-indexed)
 * @returns {Promise<Array>} Array of file objects
 */
async function fetchPRFiles(pullID, page = 1) {
  return githubApiCall(`/pulls/${pullID}/files?page=${page}`);
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
  return githubApiCall(`/pulls/${pullID}/commits`);
}

/**
 * Creates a new pull request
 * @param {string} title - The PR title
 * @param {string} body - The PR description
 * @param {string} head - The head branch name
 * @param {string} base - The base branch name
 * @returns {Promise<Object>} The created PR object
 */
async function createPullRequest(title, body, head, base) {
  return githubApiCall("/pulls", {
    method: "POST",
    body: JSON.stringify({
      title,
      body,
      head,
      base,
      draft: true,
    }),
  });
}

/**
 * Adds a label to a pull request
 * @param {number} prNumber - The PR number
 * @param {string} label - The label name to add
 * @returns {Promise<Array>} Array of labels on the PR
 */
async function addLabelToPR(prNumber, label) {
  return githubApiCall(`/issues/${prNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({
      labels: [label],
    }),
  });
}

/**
 * Assigns a user to a pull request
 * @param {number} prNumber - The PR number
 * @param {string} username - The GitHub username to assign
 * @returns {Promise<Object>} The updated issue object
 */
async function assignUserToPR(prNumber, username) {
  return githubApiCall(`/issues/${prNumber}/assignees`, {
    method: "POST",
    body: JSON.stringify({
      assignees: [username],
    }),
  });
}

/**
 * Updates a pull request
 * @param {number} prNumber - The PR number
 * @param {Object} updates - Object with title and/or body to update
 * @returns {Promise<Object>} The updated PR object
 */
async function updatePullRequest(prNumber, updates) {
  return githubApiCall(`/pulls/${prNumber}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

/**
 * Removes a label from a pull request
 * @param {number} prNumber - The PR number
 * @param {string} label - The label name to remove
 * @returns {Promise<Array>} Array of remaining labels
 */
async function removeLabelFromPR(prNumber, label) {
  return githubApiCall(`/issues/${prNumber}/labels/${label}`, {
    method: "DELETE",
  });
}

/**
 * Refreshes a PR's description with updated specs, commits, and translations
 * @param {number|string} prNumber - The PR number
 * @returns {Promise<void>}
 */
async function refreshPRDescription(prNumber) {
  // Fetch the PR data
  const files = await fetchAllPRFiles(prNumber);
  const commits = await fetchPRCommits(prNumber);

  // Fetch current PR to get body
  const pr = await githubApiCall(`/pulls/${prNumber}`);
  const branchName = pr.head.ref;
  const isBranchTranslation = isTranslationBranch(branchName);

  let updatedBody = pr.body || "";

  if (isBranchTranslation) {
    // Update translation completions
    const completionText = generateLocaleCompletionText(files);
    updatedBody = replaceLocaleCompletion(updatedBody, completionText);
  } else {
    // Update feature PR: specs, commits, and translation status
    const specsPercentage = calculateSpecsPercentageFromFiles(files);
    updatedBody = replaceSpecsPercentage(updatedBody, specsPercentage);
    updatedBody = replaceCommitsWith(commits, updatedBody);

    // Get current labels
    const currentLabels = pr.labels.map(label => label.name);

    // Check if en.yml is in the PR diff
    const hasEnYml = files.some(file =>
      file.filename.endsWith("en.yml") &&
      file.filename.startsWith("config/locales/") &&
      file.status !== "removed"
    );

    // Check if all locales are present and update status/labels
    if (areAllLocalesPresent(files)) {
      updatedBody = updateLyriqStatus(updatedBody, STATUS_PATTERNS.DONE);

      // Swap labels via API if needed
      if (currentLabels.includes("has_translations")) {
        await removeLabelFromPR(prNumber, "has_translations");
        await addLabelToPR(prNumber, "translations_done");
      } else if (!currentLabels.includes("translations_done")) {
        await addLabelToPR(prNumber, "translations_done");
      }
    } else if (hasEnYml && !currentLabels.includes("has_translations") && !currentLabels.includes("translations_done")) {
      // Only add has_translations if all locales are NOT present
      await addLabelToPR(prNumber, "has_translations");

      // Update Lyriq status to "In Progress" if there's a Lyriq Branch link
      if (updatedBody.includes(`[Lyriq Branch](${GITHUB_REPO_URL}/pull/`)) {
        updatedBody = updateLyriqStatus(updatedBody, STATUS_PATTERNS.IN_PROGRESS);
      }
    }
  }

  // Update PR via API
  await updatePullRequest(prNumber, { body: updatedBody });
}
