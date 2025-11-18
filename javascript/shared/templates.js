/**
 * PR description template generators
 */

/**
 * Generates the feature PR template
 * @param {number} specsPercentage - Percentage of specs in the PR
 * @param {string} joinedCommitTitles - Newline-separated commit titles
 * @param {number} commitCount - Number of commits (to determine if "Commit by commit" should be included)
 * @param {boolean} includeLyriq - Whether to include the Lyriq Branch line (only if en.yml is in diff)
 * @returns {string} The formatted PR description
 */
function featureText(specsPercentage, joinedCommitTitles = "", commitCount = 0, includeLyriq = false) {
  const commitByCommitLine = commitCount > 1 ? `${COMMIT_BY_COMMIT_LINE}\n` : "";
  const lyriqLine = includeLyriq ? `${LYRIQ_BRANCH_LINE}\n` : "";
  return `## Links
  📝   [PRD]()${lyriqLine}
  🎨   [Figma]()
  🪸   [Deep Dive]()
  💬   [Slack]()
  🐛   [Bugsnag]()

## Timeline
* Previous PR: _None_
* Followup PR: _None_

## Review Guide
${commitByCommitLine}  🌈   _${specsPercentage}% of the diff is specs_

## Context

## Implementation

## Commits
### ${joinedCommitTitles}

## Screens
| Before | After |
| --- | --- |
| <img src=""> | <img src=""> |
| <video src=""> | <video src=""> |`;
}

/**
 * Generates the translations PR template
 * @returns {string} The formatted PR description
 */
function translationsText() {
  const completionCheckboxes = REQUIRED_LOCALES
    .map((locale, index) => `- [${index === 0 ? "x" : " "}] ${locale.flag}`)
    .join("\n");

  return `> [!NOTE]
> _This PR will not be merged onto main, it"s sole purpose is to receive Lyriq translations. The Lyriq commits will then be cherry-picked in the feature branch._

## Links
  👑   [Feature Branch]()
  💬   [Slack]()
  ♌️   [Lyriq job]()

## Completion
${completionCheckboxes}
`;
}

/**
 * Updates locale completion checkboxes based on files in PR
 * @param {Array} files - Array of file objects from GitHub API
 * @returns {string} Updated completion section text
 */
function generateLocaleCompletionText(files) {
  const localeFiles = files.filter(
    file => file.filename.startsWith("config/locales/") && file.status !== "removed"
  );

  return REQUIRED_LOCALES
    .map(({ file: fileName, flag }) => {
      const isComplete = localeFiles.some(file => file.filename.endsWith(fileName));
      return `- [${isComplete ? "x" : " "}] ${flag}`;
    })
    .join("\n") + "\n";
}
