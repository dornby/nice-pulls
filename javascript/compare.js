// Setup
const actionBar = document.querySelector(".d-flex.my-2.mx-md-2.flex-md-justify-end");
const createPrButton = actionBar.children[0];
const textArea = document.getElementById("pull_request_body");
const titleInput = document.getElementById("pull_request_title");
const assignYourselfInput = document.getElementsByName("issue[user_assignee_ids][]")[2];
const joinedCommitTitles = extractCommitTitlesFromDOM();
let translationLabelIsAdded = false;

// Create format button by cloning the create PR button structure
actionBar.insertAdjacentHTML('afterbegin', createPrButton.outerHTML);
const formatPrButtonGroup = actionBar.children[0];

// Remove the dropdown if it exists
if (formatPrButtonGroup.children.length > 1) {
  formatPrButtonGroup.children[1].remove();
}

const formatPrButton = formatPrButtonGroup.children[0];
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

textArea.addEventListener('input', onTextAreaInput);

async function onFormatPrButtonClick() {
  const branchName = getBranchName('compare');
  const isTranslationBranch = branchName.includes('translations/');

  if (isTranslationBranch) {
    textArea.value = translationsText();
    titleInput.value = "♌️ ";
    await addLabel('lyriq');
  } else {
    const specsPercentage = calculateSpecsPercentageFromDOM();
    textArea.value = featureText(specsPercentage, joinedCommitTitles);
  }

  selectDraftMode();
  assignYourselfInput.click();
  focusAndResizeTextArea(textArea, titleInput);

  // Restore Auto-format button text after GitHub's JS runs
  setTimeout(() => {
    formatPrButton.innerText = "Auto-format";
  }, 100);
}

async function onTextAreaInput() {
  const hasLyriqBranchLink = textArea.value.includes("[Lyriq Branch](https://github.com/drivy/drivy-rails/pull/");

  if (hasLyriqBranchLink && !translationLabelIsAdded) {
    await addLabel('has_translations');
    translationLabelIsAdded = true;
  }
}

