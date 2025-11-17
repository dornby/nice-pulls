// Setup
let formatPrButton = null;
let translationLabelIsAdded = false;

function initializeAutoFormatButton() {
  const actionBar = document.querySelector(".d-flex.my-2.mx-md-2.flex-md-justify-end");
  if (!actionBar) return;

  const createPrButton = actionBar.children[0];
  if (!createPrButton) return;

  // Check if the page is fully loaded (base-ref-selector should exist)
  const baseRefSelector = document.getElementById('base-ref-selector');
  if (!baseRefSelector) return;

  // Check if Auto-format button already exists
  const existingButton = Array.from(actionBar.children).find(
    child => child.querySelector('button')?.innerText === "Auto-format"
  );
  if (existingButton) return;

  const textArea = document.getElementById("pull_request_body");
  const titleInput = document.getElementById("pull_request_title");

  // Prefill title for translation branches
  const headBranch = getHeadRefName('compare');
  const isTranslationBranch = headBranch.includes('translations/');

  if (isTranslationBranch && titleInput) {
    titleInput.value = "♌️ ";
    titleInput.focus();
    // Move cursor to end
    titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
  }

  // Create format button by cloning the create PR button structure
  actionBar.insertAdjacentHTML('afterbegin', createPrButton.outerHTML);
  const formatPrButtonGroup = actionBar.children[0];

  // Remove the dropdown if it exists
  if (formatPrButtonGroup.children.length > 1) {
    formatPrButtonGroup.children[1].remove();
  }

  formatPrButton = formatPrButtonGroup.children[0];
  formatPrButton.innerText = "Auto-format";
  formatPrButton.type = "button";
  formatPrButton.classList.remove("hx_create-pr-button", "js-sync-select-menu-button");

  applyPurpleButtonStyle(formatPrButton);

  // Clean up GitHub tracking attributes
  delete formatPrButton.dataset.hydroClick;
  delete formatPrButton.dataset.hydroClickHmac;
  delete formatPrButton.dataset.disableInvalid;
  delete formatPrButton.dataset.disableWith;

  formatPrButton.addEventListener('click', onFormatPrButtonClick);

  if (textArea && !textArea.dataset.listenerAdded) {
    textArea.addEventListener('input', onTextAreaInput);
    textArea.dataset.listenerAdded = 'true';
  }
}

// Initialize on page load
initializeAutoFormatButton();

// Watch for changes to the compare page content (when base/head branch changes)
const observer = new MutationObserver((mutations) => {
  initializeAutoFormatButton();
});

// Observe the document body for any changes
observer.observe(document.body, { childList: true, subtree: true });

// Also poll periodically as a fallback (GitHub uses Turbo which can be tricky)
setInterval(initializeAutoFormatButton, 500);

async function onFormatPrButtonClick() {
  try {
    // Update button state
    formatPrButton.innerText = "Creating...";
    formatPrButton.disabled = true;

    // Get branch information
    const baseBranch = getBaseRefName('compare');
    const headBranch = getHeadRefName('compare');

    const isTranslationBranch = headBranch.includes('translations/');

    // Get current elements
    const titleInput = document.getElementById("pull_request_title");
    const joinedCommitTitles = extractCommitTitlesFromDOM();

    // Generate title and body
    let title = titleInput.value.trim();
    let body;

    if (isTranslationBranch) {
      body = translationsText();
    } else {
      const specsPercentage = calculateSpecsPercentageFromDOM();
      body = featureText(specsPercentage, joinedCommitTitles);
    }

    // Validate title
    if (!title) {
      alert('Please enter a title for the pull request');
      formatPrButton.innerText = "Auto-format";
      formatPrButton.disabled = false;
      return;
    }

    // Create PR via API
    const pr = await createPullRequest(title, body, headBranch, baseBranch);

    // Redirect to the newly created PR
    window.location.href = pr.html_url;
  } catch (error) {
    console.error('Failed to create PR:', error);
    alert(`Failed to create pull request: ${error.message}`);
    formatPrButton.innerText = "Auto-format";
    formatPrButton.disabled = false;
  }
}

async function onTextAreaInput() {
  const textArea = document.getElementById("pull_request_body");
  const hasLyriqBranchLink = textArea.value.includes("[Lyriq Branch](https://github.com/drivy/drivy-rails/pull/");

  if (hasLyriqBranchLink && !translationLabelIsAdded) {
    await addLabel('has_translations');
    translationLabelIsAdded = true;
  }
}

