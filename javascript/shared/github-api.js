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

async function addLabelToPR(prNumber, label) {
  return githubApiCall(`/issues/${prNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels: [label] }),
  });
}

async function assignUserToPR(prNumber, username) {
  return githubApiCall(`/issues/${prNumber}/assignees`, {
    method: "POST",
    body: JSON.stringify({ assignees: [username] }),
  });
}

async function updatePullRequest(prNumber, updates) {
  return githubApiCall(`/pulls/${prNumber}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

async function removeLabelFromPR(prNumber, label) {
  return githubApiCall(`/issues/${prNumber}/labels/${label}`, {
    method: "DELETE",
  });
}

async function refreshPRDescription(prNumber) {
  const files = await fetchAllPRFiles(prNumber);
  const commits = await fetchPRCommits(prNumber);
  const pr = await githubApiCall(`/pulls/${prNumber}`);
  const branchName = pr.head.ref;
  const isBranchTranslation = isTranslationBranch(branchName);
  const isBranchFix = isFixBranch(branchName);

  let updatedBody = pr.body || "";

  if (isBranchTranslation) {
    const completionText = generateLocaleCompletionText(files);
    updatedBody = replaceLocaleCompletion(updatedBody, completionText);
  } else {
    const specsPercentage = calculateSpecsPercentageFromFiles(files);
    updatedBody = replaceSpecsPercentage(updatedBody, specsPercentage);
    updatedBody = replaceCommitsWith(commits, updatedBody);

    const currentLabels = pr.labels.map(label => label.name);
    const hasEnYml = files.some(file =>
      file.filename.endsWith(EN_YML) &&
      file.filename.startsWith(LOCALES_PATH) &&
      file.status !== "removed"
    );

    if (hasEnYml && !updatedBody.includes("[Lyriq Branch]")) {
      if (isBranchFix) {
        const linksHeaderRegex = /(## Links)/;
        if (linksHeaderRegex.test(updatedBody)) {
          updatedBody = updatedBody.replace(linksHeaderRegex, `$1\n${LYRIQ_BRANCH_LINE}`);
        }
      } else {
        const prdLineRegex = /([ \s]*📝[ \s]+\[PRD\]\([^)]*\))/;
        if (prdLineRegex.test(updatedBody)) {
          updatedBody = updatedBody.replace(prdLineRegex, `$1\n${LYRIQ_BRANCH_LINE}`);
        }
      }
    }

    if (areAllLocalesPresent(files)) {
      updatedBody = updateLyriqStatus(updatedBody, STATUS_PATTERNS.DONE);

      if (currentLabels.includes(LABELS.HAS_TRANSLATIONS)) {
        await removeLabelFromPR(prNumber, LABELS.HAS_TRANSLATIONS);
        await addLabelToPR(prNumber, LABELS.TRANSLATIONS_DONE);
      } else if (!currentLabels.includes(LABELS.TRANSLATIONS_DONE)) {
        await addLabelToPR(prNumber, LABELS.TRANSLATIONS_DONE);
      }
    } else if (hasEnYml && !currentLabels.includes(LABELS.HAS_TRANSLATIONS) && !currentLabels.includes(LABELS.TRANSLATIONS_DONE)) {
      await addLabelToPR(prNumber, LABELS.HAS_TRANSLATIONS);

      if (updatedBody.includes(`[Lyriq Branch](${GITHUB_REPO_URL}/pull/`)) {
        updatedBody = updateLyriqStatus(updatedBody, STATUS_PATTERNS.IN_PROGRESS);
      }
    }
  }

  await updatePullRequest(prNumber, { body: updatedBody });
}
