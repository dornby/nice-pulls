async function refreshPRDescription(prNumber) {
  const files = await fetchAllPRFiles(prNumber);
  const commits = await fetchPRCommits(prNumber);
  const pr = await githubApiCall(`/pulls/${prNumber}`);
  const branchName = pr.head.ref;
  const isBranchTranslation = isTranslationBranch(branchName);
  const isBranchFix = isFixBranch(branchName);

  let updatedBody = pr.body || "";

  if (isBranchTranslation) {
    const completionText = generateLocaleCompletionText(files);
    updatedBody = replaceLocaleCompletion(updatedBody, completionText);
  } else {
    const specsPercentage = calculateSpecsPercentageFromFiles(files);
    updatedBody = replaceSpecsPercentage(updatedBody, specsPercentage);
    updatedBody = replaceCommitsWith(commits, updatedBody);

    const currentLabels = pr.labels.map(label => label.name);
    const hasEnYml = files.some(file =>
      file.filename.endsWith(EN_YML) &&
      file.filename.startsWith(LOCALES_PATH) &&
      file.status !== "removed"
    );

    if (hasEnYml && !updatedBody.includes("[Lyriq Branch]")) {
      if (isBranchFix) {
        const linksHeaderRegex = /(## Links)/;
        if (linksHeaderRegex.test(updatedBody)) {
          updatedBody = updatedBody.replace(linksHeaderRegex, `$1\n${LYRIQ_BRANCH_LINE}`);
        }
      } else {
        const prdLineRegex = /([ \s]*📝[ \s]+\[PRD\]\([^)]*\))/;
        if (prdLineRegex.test(updatedBody)) {
          updatedBody = updatedBody.replace(prdLineRegex, `$1\n${LYRIQ_BRANCH_LINE}`);
        }
      }
    }

    if (areAllLocalesPresent(files)) {
      updatedBody = updateLyriqStatus(updatedBody, STATUS_PATTERNS.DONE);

      if (currentLabels.includes(LABELS.HAS_TRANSLATIONS)) {
        await removeLabelFromPR(prNumber, LABELS.HAS_TRANSLATIONS);
        await addLabelToPR(prNumber, LABELS.TRANSLATIONS_DONE);
      } else if (!currentLabels.includes(LABELS.TRANSLATIONS_DONE)) {
        await addLabelToPR(prNumber, LABELS.TRANSLATIONS_DONE);
      }
    } else if (hasEnYml && !currentLabels.includes(LABELS.HAS_TRANSLATIONS) && !currentLabels.includes(LABELS.TRANSLATIONS_DONE)) {
      await addLabelToPR(prNumber, LABELS.HAS_TRANSLATIONS);

      if (updatedBody.includes(`[Lyriq Branch](${GITHUB_REPO_URL}/pull/`)) {
        updatedBody = updateLyriqStatus(updatedBody, STATUS_PATTERNS.IN_PROGRESS);
      }
    }
  }

  await updatePullRequest(prNumber, { body: updatedBody });
}
