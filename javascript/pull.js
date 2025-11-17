// Initialize
let translationLabelIsAdded = hasLabel("has_translations");

async function onPaste() {
  setTimeout(async () => {
    // Get fresh reference to textarea after paste has processed
    const textArea = getTextArea();
    if (!textArea) return;

    const hasLyriqBranchLink = textArea.value.includes(`[Lyriq Branch](${GITHUB_REPO_URL}/pull/`);

    if (hasLyriqBranchLink && !translationLabelIsAdded) {
      try {
        // Show visual feedback
        createLoadingNotification("Updating PR...");

        const pullID = getPullRequestId();

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
      await refreshPRDescription(pullID);

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
