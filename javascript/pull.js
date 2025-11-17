// Initialize
let translationLabelIsAdded = hasLabel("has_translations");

/**
 * Waits for an element to appear in the DOM
 * @param {string} selector - CSS selector for the element
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Element>} The found element
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

async function onPaste() {
  setTimeout(async () => {
    // Get fresh reference to textarea after paste has processed
    const textArea = getTextArea();
    if (!textArea) return;

    const hasLyriqBranchLink = textArea.value.includes(`[Lyriq Branch](${GITHUB_REPO_URL}/pull/`);

    if (hasLyriqBranchLink && !translationLabelIsAdded) {
      try {
        // Show visual feedback
        const notification = document.createElement("div");
        notification.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #670070;
          color: white;
          padding: 16px 24px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
        `;
        notification.innerHTML = `
          <svg style="animation: spin 1s linear infinite;" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" stroke-dasharray="43.98" stroke-dashoffset="10.99" opacity="0.25"/>
            <path d="M8 1a7 7 0 0 1 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Updating PR...
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        `;
        document.body.appendChild(notification);

        const pullID = getPullRequestId();
        const titleInput = document.getElementById("issue_title");

        // Update PR body with current textarea value (with Lyriq status updated)
        const updatedBody = updateLyriqStatus(textArea.value, STATUS_PATTERNS.IN_PROGRESS);
        await updatePullRequest(pullID, { body: updatedBody });

        // Add has_translations label via API
        await addLabelToPR(pullID, "has_translations");
        translationLabelIsAdded = true;

        // Refresh the page to show changes
        window.location.reload();
      } catch (error) {
        console.error("Error updating PR on paste:", error);
        alert(`Error updating PR: ${error.message}`);
      }
    }
  }, TIMING.PASTE_DELAY);
}

function getTextArea() {
  return document.getElementsByName("pull_request[body]")[0];
}

async function updateLocaleCompletionBoxes(files) {
  const textArea = getTextArea();
  const completionText = generateLocaleCompletionText(files);
  textArea.value = replaceLocaleCompletion(textArea.value, completionText);
}

async function updateTranslationsPR(pullID) {
  const files = await fetchAllPRFiles(pullID);
  await updateLocaleCompletionBoxes(files);
}

async function updateFeaturePR(pullID) {
  const files = await fetchAllPRFiles(pullID);
  const specsPercentage = calculateSpecsPercentageFromFiles(files);
  const textArea = getTextArea();
  let updatedContent = replaceSpecsPercentage(textArea.value, specsPercentage);

  const commits = await fetchPRCommits(pullID);
  updatedContent = replaceCommitsWith(commits, updatedContent);

  if (areAllLocalesPresent(files)) {
    updatedContent = updateLyriqStatus(updatedContent, STATUS_PATTERNS.DONE);

    if (hasLabel("has_translations")) {
      await swapLabels("has_translations", "translations_done");
      await new Promise(resolve => setTimeout(resolve, TIMING.GITHUB_UI_DELAY));
    } else if (!hasLabel("translations_done")) {
      await addLabel("translations_done");
      await new Promise(resolve => setTimeout(resolve, TIMING.GITHUB_UI_DELAY));
    }
  }

  textArea.value = updatedContent;
}

document.addEventListener("paste", onPaste);

function initRefreshButton() {
  const actions = document.querySelector(".gh-header-actions");
  if (!actions) return; // Element not ready yet

  // Check if button already exists
  if (actions.querySelector("[data-nice-pulls-refresh]")) {
    return; // Already initialized
  }

  const editButton = actions.children[0];
  if (!editButton) return;

  const refreshButtonGroup = createStyledButton(editButton, "Refresh desc", async () => {
    try {
      const pullID = getPullRequestId();
      const branchName = getHeadRefName("pull");
      const isBranchTranslation = isTranslationBranch(branchName);

      // Fetch data from API
      const files = await fetchAllPRFiles(pullID);

      // Fetch current PR to get body
      const pr = await githubApiCall(`/pulls/${pullID}`);
      let updatedBody = pr.body || "";

      if (isBranchTranslation) {
        // Update translation completions
        const completionText = generateLocaleCompletionText(files);
        updatedBody = replaceLocaleCompletion(updatedBody, completionText);
      } else {
        // Update feature PR: specs, commits, and translation status
        const specsPercentage = calculateSpecsPercentageFromFiles(files);
        updatedBody = replaceSpecsPercentage(updatedBody, specsPercentage);

        const commits = await fetchPRCommits(pullID);
        updatedBody = replaceCommitsWith(commits, updatedBody);

        // Check if all locales are present and update status
        if (areAllLocalesPresent(files)) {
          updatedBody = updateLyriqStatus(updatedBody, STATUS_PATTERNS.DONE);

          // Swap labels via API
          if (hasLabel("has_translations")) {
            await removeLabelFromPR(pullID, "has_translations");
            await addLabelToPR(pullID, "translations_done");
          } else if (!hasLabel("translations_done")) {
            await addLabelToPR(pullID, "translations_done");
          }
        }
      }

      // Update PR via API
      await updatePullRequest(pullID, { body: updatedBody });

      // Refresh the page to show changes
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing description:", error);
      alert(`Error refreshing description: ${error.message}`);
    }
  });

  const refreshButton = refreshButtonGroup.children[0];
  refreshButton.ariaLabel = null;
  refreshButton.dataset.gaClick = null;
  refreshButton.dataset.nicePullsRefresh = "true"; // Mark as initialized
  refreshButton.classList.remove("js-details-target", "js-title-edit-button");
  refreshButton.classList.add("Button--secondary", "Button--small", "Button", "m-0", "mr-md-0");

  actions.insertAdjacentElement("afterbegin", refreshButtonGroup);
}

// Initialize immediately and watch for changes
initializeWithObserver(initRefreshButton, {
  debounceMs: 200,
  usePolling: true,
  pollingInterval: 1000
});
