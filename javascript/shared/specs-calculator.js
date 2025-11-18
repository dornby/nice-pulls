function calculateSpecsPercentage(items, getChanges, getFilename) {
  let linesCount = 0;
  let linesSpecCount = 0;

  items.forEach((item) => {
    const changes = getChanges(item);
    const filename = getFilename(item);

    linesCount += changes;
    if (filename.includes(SPEC_FILE_PATTERN)) {
      linesSpecCount += changes;
    }
  });

  if (linesCount === 0) return 0;
  return ((linesSpecCount / linesCount) * 100).toFixed();
}

function calculateSpecsPercentageFromDOM() {
  const fileInfos = Array.from(document.querySelectorAll(SELECTORS.FILE_INFO));

  return calculateSpecsPercentage(
    fileInfos,
    (fileInfo) => parseInt(fileInfo.querySelector(SELECTORS.DIFFSTAT).innerText),
    (fileInfo) => fileInfo.querySelector(SELECTORS.TRUNCATE_LINK).title
  );
}

function calculateSpecsPercentageFromFiles(files) {
  return calculateSpecsPercentage(
    files,
    (file) => file.changes,
    (file) => file.filename
  );
}
