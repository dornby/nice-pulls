/**
 * PR description template generators
 */

/**
 * Generates the feature PR template
 * @param {number} specsPercentage - Percentage of specs in the PR
 * @param {string} joinedCommitTitles - Newline-separated commit titles
 * @returns {string} The formatted PR description
 */
function featureText(specsPercentage, joinedCommitTitles = '') {
  return `## Links
  📝   [PRD]()
  ♌️   [Lyriq Branch]() | _Not yet started_ 👻
  🎨   [Figma]()
  🪸   [Deep Dive]()
  💬   [Slack]()
  🐛   [Bugsnag]()

## Timeline
* Previous PR: _None_
* Followup PR: _None_

## Review Guide
  🪜   Commit by commit
  🌈   _${specsPercentage}% of the diff is specs_

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
  return `> [!NOTE]
> _This PR will not be merged onto main, it's sole purpose is to receive Lyriq translations. The Lyriq commits will then be cherry-picked in the feature branch._

## Links
👑  [Feature Branch]()
💬  [Slack]()
♌️  [Lyriq job]()

## Completion
- [x] 🇬🇧
- [ ] 🇫🇷
- [ ] 🇳🇴
- [ ] 🇩🇪
- [ ] 🇪🇸
- [ ] 🇧🇪
`;
}

/**
 * Generates the translations PR template
 * @returns {string} The formatted PR description
 */
function translationsText() {
  let text = '';
  text += `> [!NOTE]\n> _This PR will not be merged onto main, it's sole purpose is to receive Lyriq translations. The Lyriq commits will then be cherry-picked in the feature branch._\n\n`;
  text += `## Links\n👑  [Feature Branch]()\n💬  [Slack]()\n♌️  [Lyriq job]()\n\n`;
  text += `## Completion\n- [x] 🇬🇧\n- [ ] 🇫🇷\n- [ ] 🇳🇴\n- [ ] 🇩🇪\n- [ ] 🇪🇸\n- [ ] 🇧🇪\n`;
  return text;
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

  const localeMap = {
    "en.yml": "🇬🇧",
    "fr.yml": "🇫🇷",
    "nb_NO.yml": "🇳🇴",
    "de.yml": "🇩🇪",
    "es.yml": "🇪🇸",
    "nl_BE.yml": "🇧🇪"
  };

  return Object.entries(localeMap)
    .map(([fileName, flag]) => {
      const isComplete = localeFiles.some(file => file.filename.endsWith(fileName));
      return `- [${isComplete ? 'x' : ' '}] ${flag}`;
    })
    .join('\n') + '\n';
}
