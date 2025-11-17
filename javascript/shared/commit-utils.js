/**
 * Commit processing utilities for PR descriptions
 */

/**
 * Extracts commit titles from DOM elements
 * @returns {string} Newline-separated commit titles
 */
function extractCommitTitlesFromDOM() {
  const commits = document.querySelectorAll(".Link--primary.text-bold.js-navigation-open.markdown-title");
  return Array.from(commits)
    .map(commit => commit.text)
    .join("\n### ");
}

/**
 * Updates the commits section in PR description
 * @param {Array} commits - Array of commit objects from GitHub API
 * @param {string} textAreaContent - Current textarea content
 * @returns {string} Updated content with new commits
 */
function replaceCommitsWith(commits, textAreaContent) {
  if (!textAreaContent) {
    return textAreaContent;
  }

  const hasCommitsTitle = textAreaContent.includes("## Commits");
  if (!hasCommitsTitle) {
    return textAreaContent;
  }

  // Update "Commit by commit" line based on commit count
  const commitByCommitLine = "  🪜   Commit by commit\n";
  const hasCommitByCommit = textAreaContent.includes(commitByCommitLine);

  if (commits.length > 1 && !hasCommitByCommit) {
    // Add the line if there are multiple commits and it's not present
    // Insert before the rainbow specs line
    textAreaContent = textAreaContent.replace(
      /## Review Guide\n(  🌈)/,
      "## Review Guide\n" + commitByCommitLine + "$1"
    );
  } else if (commits.length <= 1 && hasCommitByCommit) {
    // Remove the line if there's only one commit and it's present
    textAreaContent = textAreaContent.replace(commitByCommitLine, "");
  }

  const splitContent = textAreaContent.split("## Commits");
  const beforeCommitsTitleContent = splitContent[0];
  const afterCommitsTitleContent = splitContent[1];

  const splitAfterCommitsTitleContent = afterCommitsTitleContent ?
    afterCommitsTitleContent.split("\n## ") :
    [];

  const commitsContent = afterCommitsTitleContent ?
    splitAfterCommitsTitleContent[0] :
    "";

  const afterCommitsContent = afterCommitsTitleContent ?
    splitAfterCommitsTitleContent.slice(1).join("\n## ") :
    "";

  const commitsContentSplited = commitsContent.split("\n### ");
  const commitsToKeep = commitsContentSplited.filter((commit) => notAnEmptyCommit(commit));

  let commitsCleanedContent = "";
  commitsToKeep.forEach((commit) => {
    commitsCleanedContent += `\n### ${commit}`;
  });

  let newCommitsContent = "";
  commits.forEach((commit) => {
    const commitMessage = commit.commit.message;

    if (addToNewCommits(commitsContent, commitMessage)) {
      newCommitsContent += `\n### ${commitMessage}`;
    }
  });

  const newContent = afterCommitsContent ?
    beforeCommitsTitleContent + "## Commits" + commitsCleanedContent + newCommitsContent + "\n## " + afterCommitsContent :
    beforeCommitsTitleContent + "## Commits" + commitsCleanedContent + newCommitsContent;

  return newContent;
}

/**
 * Checks if a commit should be added to the new commits list
 * @param {string} commitsContent - Existing commits content
 * @param {string} commitMessage - New commit message to check
 * @returns {boolean} True if commit should be added
 */
function addToNewCommits(commitsContent, commitMessage) {
  if (!commitsContent.includes(commitMessage)) {
    return true;
  }

  const linesAfterCommit = commitsContent
    .split(commitMessage)[1]
    .split("\n")
    .filter(line => line !== "");

  if (linesAfterCommit.length === 0) {
    return true;
  }

  return linesAfterCommit[0].includes("###");
}

/**
 * Checks if a commit entry is not empty
 * @param {string} commit - The commit content to check
 * @returns {boolean} True if commit is not empty
 */
function notAnEmptyCommit(commit) {
  const lines = commit.split("\n");
  return lines.length > 1 && lines[1] !== "";
}

/**
 * Replaces the specs percentage in the PR description
 * @param {string} textAreaContent - Current textarea content
 * @param {number} specsPercentage - New percentage value
 * @returns {string} Updated content
 */
function replaceSpecsPercentage(textAreaContent, specsPercentage) {
  // Use regex to replace the percentage value between "🌈   _" and "% of the diff is specs_"
  const regex = /(🌈\s+_)\d+(%\s+of\s+the\s+diff\s+is\s+specs_)/;
  return textAreaContent.replace(regex, `$1${specsPercentage}$2`);
}

/**
 * Replaces the locale completion section in the PR description
 * @param {string} textAreaContent - Current textarea content
 * @param {string} completionText - New completion text
 * @returns {string} Updated content
 */
function replaceLocaleCompletion(textAreaContent, completionText) {
  const completionTitle = "## Completion\n";
  const splitContent = textAreaContent.split(completionTitle);
  const newContent = splitContent[0] + completionTitle + completionText;

  return newContent.replace(/\n$/, "");
}
