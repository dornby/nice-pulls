// Initialize
loadGithubToken();

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
  const textArea = document.getElementsByName("pull_request[body]")[0];
  const hasLyriqBranchLink = textArea.value.includes("[Lyriq Branch](https://github.com/drivy/drivy-rails/pull/");

  setTimeout(async () => {
    if (hasLyriqBranchLink && !translationLabelIsAdded) {
      await addLabel("has_translations");
      translationLabelIsAdded = true;
    }
  }, 500);
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
  const updatedContent = replaceSpecsPercentage(textArea.value, specsPercentage);

  const commits = await fetchPRCommits(pullID);
  textArea.value = replaceCommitsWith(commits, updatedContent);
}

document.addEventListener('paste', onPaste);

function initRefreshButton() {
  const actions = document.querySelector(".gh-header-actions");
  if (!actions || actions.querySelector('[data-nice-pulls-refresh]')) {
    return; // Already initialized or element not ready
  }

  const editButton = actions.children[0];
  if (!editButton) return;

  const refreshButtonGroup = createStyledButton(editButton, "Refresh desc", async () => {
    try {
      const pullID = getPullRequestId();
      const branchName = getBranchName('pull');
      const isTranslationBranch = branchName.includes('translations/');

      // Open the actions menu
      const detailsButton = document.querySelector(".timeline-comment-actions details summary");
      if (!detailsButton) {
        console.error('Details button not found');
        return;
      }
      detailsButton.click();

      // Wait for menu to open
      await waitForElement(".js-comment-edit-button", 1000);
      const editButton = document.querySelector(".js-comment-edit-button");
      if (!editButton) {
        console.error('Edit button not found');
        return;
      }
      editButton.click();

      // Wait for edit form to load
      await waitForElement(".js-comment-update", 2000);

      // Update the PR description
      if (isTranslationBranch) {
        await updateTranslationsPR(pullID);
      } else {
        await updateFeaturePR(pullID);
      }

      // Trigger input event to let GitHub know the content changed
      const textArea = getTextArea();
      if (textArea) {
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
        textArea.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Wait a moment for GitHub to process the changes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Click Update comment button
      const updateButton = document.querySelector(".js-comment-update").querySelector("button[type=submit]");
      if (!updateButton) {
        console.error('Update button not found');
        return;
      }
      debugger;
      updateButton.click();
    } catch (error) {
      console.error('Error refreshing description:', error);
    }
  });

  const refreshButton = refreshButtonGroup.children[0];
  refreshButton.ariaLabel = null;
  refreshButton.dataset.gaClick = null;
  refreshButton.dataset.nicePullsRefresh = "true"; // Mark as initialized
  refreshButton.classList.remove("js-details-target", "js-title-edit-button");
  refreshButton.classList.add("Button--secondary", "Button--small", "Button", "m-0", "mr-md-0");

  actions.insertAdjacentElement('afterbegin', refreshButtonGroup);
}

// Initialize immediately
initRefreshButton();

// Also watch for dynamic content changes (GitHub SPA navigation)
// Use debouncing to avoid excessive checks
let initTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(initTimeout);
  initTimeout = setTimeout(initRefreshButton, 100);
});

// Only observe the main container, not the entire body
const mainContent = document.querySelector('main') || document.body;
observer.observe(mainContent, {
  childList: true,
  subtree: false // Don't watch deeply nested changes
});
