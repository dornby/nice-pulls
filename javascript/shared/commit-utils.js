function extractCommitTitlesFromDOM() {
  const commits = document.querySelectorAll(SELECTORS.COMMIT_TITLE);
  return Array.from(commits)
    .map(commit => commit.text)
    .join("\n### ");
}


function replaceCommitsWith(commits, textAreaContent) {
  if (!textAreaContent || !textAreaContent.includes("## Commits")) {
    return textAreaContent;
  }

  const hasCommitByCommit = textAreaContent.includes(COMMIT_BY_COMMIT_LINE);

  if (commits.length > 1 && !hasCommitByCommit) {
    let reviewGuideIndex = textAreaContent.indexOf("## Review Guide\n");

    if (reviewGuideIndex === -1) {
      reviewGuideIndex = textAreaContent.indexOf("## Review Guide\r\n");
    }

    if (reviewGuideIndex === -1) {
      const guideIndex = textAreaContent.indexOf("## Review Guide");
      if (guideIndex !== -1) {
        const nextNewline = textAreaContent.indexOf("\n", guideIndex);
        if (nextNewline !== -1) {
          const insertPosition = nextNewline + 1;
          const nextChar = textAreaContent[insertPosition];
          const separator = (nextChar === '\n' || nextChar === '\r') ? "" : "\n";
          textAreaContent = textAreaContent.slice(0, insertPosition) +
                            COMMIT_BY_COMMIT_LINE + separator +
                            textAreaContent.slice(insertPosition);
        }
      }
    } else {
      const reviewGuideMarker = "## Review Guide\n";
      const insertPosition = reviewGuideIndex + reviewGuideMarker.length;
      const nextChar = textAreaContent[insertPosition];
      const separator = (nextChar === '\n' || nextChar === '\r') ? "" : "\n";
      textAreaContent = textAreaContent.slice(0, insertPosition) +
                        COMMIT_BY_COMMIT_LINE + separator +
                        textAreaContent.slice(insertPosition);
    }
  } else if (commits.length <= 1 && hasCommitByCommit) {
    textAreaContent = textAreaContent.replace(COMMIT_BY_COMMIT_LINE, "");
  }  const [beforeCommits, afterCommitsTitle] = textAreaContent.split("## Commits");
  const splitAfter = afterCommitsTitle ? afterCommitsTitle.split("\n## ") : [];
  const commitsContent = afterCommitsTitle ? splitAfter[0] : "";
  const afterCommits = afterCommitsTitle ? splitAfter.slice(1).join("\n## ") : "";

  const commitsToKeep = commitsContent.split("\n### ").filter(isNonEmptyCommit);
  const commitsCleanedContent = commitsToKeep.map(c => `\n### ${c}`).join("");

  const newCommitsContent = commits
    .map(c => c.commit.message)
    .filter(msg => shouldAddCommit(commitsContent, msg))
    .map(msg => `\n### ${msg}`)
    .join("");

  return afterCommits ?
    beforeCommits + "## Commits" + commitsCleanedContent + newCommitsContent + "\n## " + afterCommits :
    beforeCommits + "## Commits" + commitsCleanedContent + newCommitsContent;
}

function shouldAddCommit(commitsContent, commitMessage) {
  if (!commitsContent.includes(commitMessage)) {
    return true;
  }

  const linesAfter = commitsContent
    .split(commitMessage)[1]
    .split("\n")
    .filter(line => line !== "");

  return linesAfter.length === 0 || linesAfter[0].includes("###");
}

function isNonEmptyCommit(commit) {
  const lines = commit.split("\n");
  return lines.length > 1 && lines[1] !== "";
}

function replaceSpecsPercentage(textAreaContent, specsPercentage) {
  const regex = /([ \s]*🌈[ \s]+_)\d+(%\s+of\s+the\s+diff\s+is\s+specs_)/;
  return textAreaContent.replace(regex, `$1${specsPercentage}$2`);
}

function replaceLocaleCompletion(textAreaContent, completionText) {
  const completionTitle = "## Completion\n";
  const splitContent = textAreaContent.split(completionTitle);
  return (splitContent[0] + completionTitle + completionText).replace(/\n$/, "");
}
