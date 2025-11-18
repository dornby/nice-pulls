// Setup
let formatPrButton = null;

function initializeAutoFormatButton() {
  const actionBar = document.querySelector(".d-flex.my-2.mx-md-2.flex-md-justify-end");
  if (!actionBar) return;

  const createPrButton = actionBar.children[0];
  if (!createPrButton) return;

  // Check if the page is fully loaded (base-ref-selector should exist)
  const baseRefSelector = document.getElementById("base-ref-selector");
  if (!baseRefSelector) return;

  // Check if Auto-format button already exists
  const existingButton = actionBar.querySelector("[data-nice-pulls-button]");
  if (existingButton) return;

  const titleInput = document.getElementById("pull_request_title");

  // Prefill title for translation branches
  const headBranch = getHeadRefName("compare");

  if (isTranslationBranch(headBranch) && titleInput) {
    titleInput.value = "♌️ ";
    titleInput.focus();
    // Move cursor to end
    titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
  }

  // Create format button by cloning the create PR button structure
  actionBar.insertAdjacentHTML("afterbegin", createPrButton.outerHTML);
  const formatPrButtonGroup = actionBar.children[0];

  // Remove the dropdown if it exists
  if (formatPrButtonGroup.children.length > 1) {
    formatPrButtonGroup.children[1].remove();
  }

  formatPrButton = formatPrButtonGroup.children[0];
  formatPrButton.innerText = "Auto-format";
  formatPrButton.type = "button";
  formatPrButton.classList.remove("hx_create-pr-button", "js-sync-select-menu-button");
  formatPrButton.dataset.nicePullsButton = "true";

  applyPurpleButtonStyle(formatPrButton);

  // Clean up GitHub tracking attributes
  delete formatPrButton.dataset.hydroClick;
  delete formatPrButton.dataset.hydroClickHmac;
  delete formatPrButton.dataset.disableInvalid;
  delete formatPrButton.dataset.disableWith;

  formatPrButton.addEventListener("click", onFormatPrButtonClick);
}

// Initialize on page load
initializeWithObserver(initializeAutoFormatButton, {
  target: document.body,
  observerOptions: { childList: true, subtree: true },
  usePolling: true,
  pollingInterval: TIMING.POLLING_INTERVAL
});

async function onFormatPrButtonClick() {
  try {
    // Update button state
    formatPrButton.innerText = "Creating...";
    formatPrButton.disabled = true;

    // Get branch information
    const baseBranch = getBaseRefName("compare");
    const headBranch = getHeadRefName("compare");

    const isBranchTranslation = isTranslationBranch(headBranch);
    const isBranchFix = isFixBranch(headBranch);

    // Get current elements
    const titleInput = document.getElementById("pull_request_title");
    const joinedCommitTitles = extractCommitTitlesFromDOM();
    const includeLyriq = hasEnYmlInDOM();

    // Generate title and body
    let title = titleInput.value.trim();
    let body;

    if (isBranchTranslation) {
      body = translationsText();
    } else if (isBranchFix) {
      const specsPercentage = calculateSpecsPercentageFromDOM();
      const commitCount = joinedCommitTitles ? joinedCommitTitles.split('\n').filter(t => t.trim()).length : 0;
      body = fixText(specsPercentage, joinedCommitTitles, commitCount, includeLyriq);
    } else {
      const specsPercentage = calculateSpecsPercentageFromDOM();
      const commitCount = joinedCommitTitles ? joinedCommitTitles.split('\n').filter(t => t.trim()).length : 0;
      body = featureText(specsPercentage, joinedCommitTitles, commitCount, includeLyriq);
    }

    // Validate title
    if (!title) {
      alert("Please enter a title for the pull request");
      formatPrButton.innerText = "Auto-format";
      formatPrButton.disabled = false;
      return;
    }

    // Create PR via API
    const pr = await createPullRequest(title, body, headBranch, baseBranch);

    // Add lyriq label for translation branches
    if (isBranchTranslation) {
      await addLabelToPR(pr.number, "lyriq");
    }

    // Add has_translations label if en.yml files are present
    if (includeLyriq) {
      await addLabelToPR(pr.number, "has_translations");
    }

    // Assign yourself to the PR
    const currentUser = await getCurrentUser();
    await assignUserToPR(pr.number, currentUser.login);

    // Redirect to the newly created PR
    window.location.href = pr.html_url;
  } catch (error) {
    console.error("Failed to create PR:", error);
    alert(`Failed to create pull request: ${error.message}`);
    formatPrButton.innerText = "Auto-format";
    formatPrButton.disabled = false;
  }
}
