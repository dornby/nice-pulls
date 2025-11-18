function featureText(specsPercentage, joinedCommitTitles = "", commitCount = 0, includeLyriq = false) {
  const commitByCommitLine = commitCount > 1 ? `${COMMIT_BY_COMMIT_LINE}\n` : "";
  const lyriqLine = includeLyriq ? `\n${LYRIQ_BRANCH_LINE}` : "";
  return `## Links
\u00a0\u00a0📝\u00a0\u00a0\u00a0[PRD]()${lyriqLine}
\u00a0\u00a0🎨\u00a0\u00a0\u00a0[Figma]()
\u00a0\u00a0🪸\u00a0\u00a0\u00a0[Deep Dive]()${SLACK_LINE}

## Timeline
* Previous PR: _None_
* Followup PR: _None_

## Review Guide
${commitByCommitLine}${SPECS_LINE(specsPercentage)}

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

function fixText(specsPercentage, joinedCommitTitles = "", commitCount = 0, includeLyriq = false) {
  const commitByCommitLine = commitCount > 1 ? `${COMMIT_BY_COMMIT_LINE}\n` : "";
  const lyriqLine = includeLyriq ? `\n${LYRIQ_BRANCH_LINE}\n` : "";
  return `## Links${lyriqLine}${SLACK_LINE}
\u00a0\u00a0🐛\u00a0\u00a0\u00a0[Bugsnag]()

## Review Guide
${commitByCommitLine}${SPECS_LINE(specsPercentage)}

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

function translationsText() {
  const completionCheckboxes = REQUIRED_LOCALES
    .map((locale, index) => `- [${index === 0 ? "x" : " "}] ${locale.flag}`)
    .join("\n");

  return `> [!NOTE]
> _This PR will not be merged onto main, it"s sole purpose is to receive Lyriq translations. The Lyriq commits will then be cherry-picked in the feature branch._

## Links
\u00a0\u00a0👑\u00a0\u00a0\u00a0[Feature Branch]()
\u00a0\u00a0💬\u00a0\u00a0\u00a0[Slack]()
\u00a0\u00a0♌️\u00a0\u00a0\u00a0[Lyriq job]()

## Completion
${completionCheckboxes}
`;
}

function generateLocaleCompletionText(files) {
  const localeFiles = files.filter(
    file => file.filename.startsWith(LOCALES_PATH) && file.status !== "removed"
  );

  return REQUIRED_LOCALES
    .map(({ file: fileName, flag }) => {
      const isComplete = localeFiles.some(file => file.filename.endsWith(fileName));
      return `- [${isComplete ? "x" : " "}] ${flag}`;
    })
    .join("\n") + "\n";
}
