// Initialize
loadGithubToken();

let translationLabelIsAdded = hasLabel("has_translations");

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
  textArea.textContent = replaceLocaleCompletion(textArea.textContent, completionText);
}

async function updateTranslationsPR(pullID) {
  const files = await fetchAllPRFiles(pullID);
  await updateLocaleCompletionBoxes(files);
}

async function updateFeaturePR(pullID) {
  const files = await fetchAllPRFiles(pullID);
  const specsPercentage = calculateSpecsPercentageFromFiles(files);
  const textArea = getTextArea();
  const updatedContent = replaceSpecsPercentage(textArea.textContent, specsPercentage);

  const commits = await fetchPRCommits(pullID);
  textArea.value = replaceCommitsWith(commits, updatedContent);
}

document.addEventListener('paste', onPaste);

// Create refresh description button
const actions = document.querySelector(".gh-header-actions");
const editButton = actions.children[0];
const refreshButtonGroup = createStyledButton(editButton, "Refresh desc", async () => {
  const pullID = getPullRequestId();
  const branchName = getBranchName('pull');
  const isTranslationBranch = branchName.includes('translations/');

  if (isTranslationBranch) {
    await updateTranslationsPR(pullID);
  } else {
    await updateFeaturePR(pullID);
  }
});

const refreshButton = refreshButtonGroup.children[0];
refreshButton.ariaLabel = null;
refreshButton.dataset.gaClick = null;
refreshButton.classList.remove("js-details-target", "js-title-edit-button");
refreshButton.classList.add("Button--secondary", "Button--small", "Button", "m-0", "mr-md-0");

actions.insertAdjacentElement('afterbegin', refreshButtonGroup);
