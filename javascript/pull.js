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
      await addLabel("has_translations");
      translationLabelIsAdded = true;

      // Update the Lyriq status to "In progress"
      updateLyriqStatusInTextArea(textArea, STATUS_PATTERNS.IN_PROGRESS);
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
  if (!actions || actions.querySelector("[data-nice-pulls-refresh]")) {
    return; // Already initialized or element not ready
  }

  const editButton = actions.children[0];
  if (!editButton) return;

  const refreshButtonGroup = createStyledButton(editButton, "Refresh desc", async () => {
    try {
      const pullID = getPullRequestId();
      const branchName = getHeadRefName("pull");
      const isBranchTranslation = isTranslationBranch(branchName);

      // Open the actions menu
      const detailsButton = document.querySelector(".timeline-comment-actions details summary");
      if (!detailsButton) {
        console.error("Details button not found");
        return;
      }
      detailsButton.click();

      // Wait for menu to open
      await waitForElement(".js-comment-edit-button", 1000);
      const editButton = document.querySelector(".js-comment-edit-button");
      if (!editButton) {
        console.error("Edit button not found");
        return;
      }
      editButton.click();

      // Wait for edit form to load
      await waitForElement(".js-comment-update", 2000);

      // Update the PR description
      if (isBranchTranslation) {
        await updateTranslationsPR(pullID);
      } else {
        await updateFeaturePR(pullID);
      }

      // Trigger input event to let GitHub know the content changed
      const textArea = getTextArea();
      if (textArea) {
        textArea.dispatchEvent(new Event("input", { bubbles: true }));
        textArea.dispatchEvent(new Event("change", { bubbles: true }));
      }

      // Wait a moment for GitHub to process the changes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Click Update comment button
      const updateButton = document.querySelector(".js-comment-update").querySelector("button[type=submit]");
      if (!updateButton) {
        console.error("Update button not found");
        return;
      }
      debugger;
      updateButton.click();
    } catch (error) {
      console.error("Error refreshing description:", error);
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
initializeWithObserver(initRefreshButton);
