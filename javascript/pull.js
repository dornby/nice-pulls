async function onPaste(event) {
  const pastedText = (event.clipboardData || window.clipboardData)?.getData('text') || '';
  const hasLyriqBranchPaste = pastedText.includes(`${GITHUB_REPO_URL}/pull/`);

  setTimeout(async () => {
    const textArea = document.getElementsByName(SELECTORS.PR_BODY_TEXTAREA)[0];
    if (!textArea) return;

    const hasLyriqBranchInBody = textArea.value.includes(`[Lyriq Branch](${GITHUB_REPO_URL}/pull/`);

    if (hasLyriqBranchInBody && hasLyriqBranchPaste) {
      try {
        createLoadingNotification("Updating PR...");
        const pullID = getPullRequestId();
        const updatedBody = updateLyriqStatus(textArea.value, STATUS_PATTERNS.IN_PROGRESS);
        await updatePullRequest(pullID, { body: updatedBody });
        window.location.reload();
      } catch (error) {
        console.error("Error updating PR on paste:", error);
        alert(`Error updating PR: ${error.message}`);
      }
    }
  }, TIMING.PASTE_DELAY);
}

document.addEventListener("paste", onPaste);

function initRefreshButton() {
  const actions = document.querySelector(SELECTORS.GH_HEADER_ACTIONS);
  if (!actions || actions.querySelector("[data-nice-pulls-refresh]")) {
    return;
  }

  const editButton = actions.children[1].children[0];
  if (!editButton) return;

  const refreshButtonGroup = createStyledButton(editButton, "Refresh desc", async () => {
    try {
      const pullID = getPullRequestId();
      await refreshPRDescription(pullID);
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing description:", error);
      alert(`Error refreshing description: ${error.message}`);
    }
  });

  const refreshButton = refreshButtonGroup.children[0];
  refreshButton.ariaLabel = null;
  refreshButton.dataset.gaClick = null;
  refreshButton.dataset.nicePullsRefresh = "true";
  refreshButton.classList.remove("js-details-target", "js-title-edit-button");
  refreshButton.classList.add("Button--secondary", "Button--small", "Button", "m-0", "mr-md-0");

  actions.insertAdjacentElement("afterbegin", refreshButtonGroup);
}

initializeWithObserver(initRefreshButton, {
  debounceMs: 200,
  usePolling: true,
  pollingInterval: 1000
});
