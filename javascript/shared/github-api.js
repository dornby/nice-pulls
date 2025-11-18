let githubBearerToken = null;

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

async function getCurrentUser() {
  const token = await loadGithubToken();
  const response = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return response.json();
}

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

async function fetchPRFiles(pullID, page = 1) {
  return githubApiCall(`/pulls/${pullID}/files?page=${page}`);
}

async function fetchAllPRFiles(pullID) {
  let allFiles = [];
  let page = 1;
  let files;

  do {
    files = await fetchPRFiles(pullID, page);
    allFiles = allFiles.concat(files);
    page++;
  } while (files.length === GITHUB_ITEMS_PER_PAGE);

  return allFiles;
}

async function fetchPRCommits(pullID) {
  return githubApiCall(`/pulls/${pullID}/commits`);
}

async function createPullRequest(title, body, head, base) {
  return githubApiCall("/pulls", {
    method: "POST",
    body: JSON.stringify({ title, body, head, base, draft: true }),
  });
}

async function updatePullRequest(prNumber, updates) {
  return githubApiCall(`/pulls/${prNumber}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

async function addLabelToPR(prNumber, label) {
  return githubApiCall(`/issues/${prNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels: [label] }),
  });
}

async function removeLabelFromPR(prNumber, label) {
  return githubApiCall(`/issues/${prNumber}/labels/${label}`, {
    method: "DELETE",
  });
}

async function assignUserToPR(prNumber, username) {
  return githubApiCall(`/issues/${prNumber}/assignees`, {
    method: "POST",
    body: JSON.stringify({ assignees: [username] }),
  });
}
