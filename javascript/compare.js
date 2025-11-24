let formatPrButton = null;

function initializeAutoFormatButton() {
  const createPrButton = document.querySelector(SELECTORS.CREATE_PR_BUTTON);
  if (!createPrButton) {
    console.error('[Nice Pulls] Create PR button not found');
    return;
  }

  const createPrButtonContainer = createPrButton.parentElement;
  const actionBar = createPrButtonContainer.parentElement;

  const baseRefSelector = document.querySelector(SELECTORS.BASE_REF_SELECTOR);
  if (!baseRefSelector) {
    console.error('[Nice Pulls] Base ref selector not found');
    return;
  }

  if (actionBar.querySelector("[data-nice-pulls-button]")) {
    console.debug('[Nice Pulls] Auto-format button already initialized');
    return;
  }

  const titleInput = document.querySelector(SELECTORS.PR_TITLE_INPUT);
  const headBranch = getHeadRefName("compare");

  if (isTranslationBranch(headBranch) && titleInput) {
    titleInput.value = "♌️ ";
    titleInput.focus();
    titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
  }

  actionBar.insertAdjacentHTML("afterbegin", createPrButtonContainer.outerHTML);
  const formatPrButtonGroup = actionBar.children[0];

  if (formatPrButtonGroup.children.length > 1) {
    formatPrButtonGroup.children[1].remove();
  }

  formatPrButton = formatPrButtonGroup.children[0];
  formatPrButton.innerText = "Auto-format";
  formatPrButton.type = "button";
  formatPrButton.classList.remove("hx_create-pr-button", "js-sync-select-menu-button");
  formatPrButton.dataset.nicePullsButton = "true";

  applyPurpleButtonStyle(formatPrButton);
  cleanButtonDataAttributes(formatPrButton);
  formatPrButton.addEventListener("click", onFormatPrButtonClick);
}

initializeWithObserver(initializeAutoFormatButton, {
  target: document.body,
  observerOptions: { childList: true, subtree: true },
  usePolling: true,
  pollingInterval: TIMING.POLLING_INTERVAL
});

async function onFormatPrButtonClick() {
  try {
    formatPrButton.innerText = "Creating...";
    formatPrButton.disabled = true;

    const baseBranch = getBaseRefName();
    const headBranch = getHeadRefName("compare");
    const isBranchTranslation = isTranslationBranch(headBranch);
    const isBranchFix = isFixBranch(headBranch);

    const titleInput = document.querySelector(SELECTORS.PR_TITLE_INPUT);
    const joinedCommitTitles = extractCommitTitlesFromDOM();
    const includeLyriq = hasEnYmlInDOM();

    let title = titleInput.value.trim();
    let body;

    if (isBranchTranslation) {
      const localeFiles = getLocaleFilesFromDOM();
      console.log(localeFiles)
      const completionText = generateLocaleCompletionText(localeFiles);
      console.log(completionText)
      body = translationsText(headBranch, completionText);
    } else {
      const specsPercentage = calculateSpecsPercentageFromDOM();
      const commitCount = joinedCommitTitles ? joinedCommitTitles.split('\n').filter(t => t.trim()).length : 0;
      body = isBranchFix ?
        fixText(specsPercentage, joinedCommitTitles, commitCount, includeLyriq) :
        featureText(specsPercentage, joinedCommitTitles, commitCount, includeLyriq);
    }

    if (!title) {
      alert("Please enter a title for the pull request");
      formatPrButton.innerText = "Auto-format";
      formatPrButton.disabled = false;
      return;
    }

    const pr = await createPullRequest(title, body, headBranch, baseBranch);

    if (isBranchTranslation) {
      await addLabelToPR(pr.number, LABELS.LYRIQ);
    }

    if (includeLyriq && !isBranchTranslation) {
      await addLabelToPR(pr.number, LABELS.HAS_TRANSLATIONS);
    }

    const currentUser = await getCurrentUser();
    await assignUserToPR(pr.number, currentUser.login);

    window.location.href = pr.html_url;
  } catch (error) {
    console.error("Failed to create PR:", error);
    alert(`Failed to create pull request: ${error.message}`);
    formatPrButton.innerText = "Auto-format";
    formatPrButton.disabled = false;
  }
}
