/**
 * Spec percentage calculation utilities
 */

/**
 * Calculates the percentage of spec lines in a PR from DOM elements
 * @returns {number} The percentage (0-100) as an integer
 */
function calculateSpecsPercentageFromDOM() {
  const fileInfos = document.querySelectorAll(".file-info");
  let linesCount = 0;
  let linesSpecCount = 0;

  fileInfos.forEach((fileInfo) => {
    const truncate = fileInfo.querySelector(".Truncate");
    const link = truncate.querySelector("a");
    const diffStats = fileInfo.querySelector(".diffstat");
    const changesString = diffStats.innerText;
    const changesInt = parseInt(changesString);

    linesCount += changesInt;

    if (link.title.includes("_spec.rb")) {
      linesSpecCount += changesInt;
    }
  });

  return calculatePercentage(linesSpecCount, linesCount);
}

/**
 * Calculates the percentage of spec lines from GitHub API file objects
 * @param {Array} files - Array of file objects from GitHub API
 * @returns {number} The percentage (0-100) as an integer
 */
function calculateSpecsPercentageFromFiles(files) {
  let linesCount = 0;
  let linesSpecCount = 0;

  files.forEach((file) => {
    linesCount += file.changes;

    if (file.filename.includes("_spec.rb")) {
      linesSpecCount += file.changes;
    }
  });

  return calculatePercentage(linesSpecCount, linesCount);
}

/**
 * Helper function to calculate percentage
 * @param {number} part - The part value
 * @param {number} total - The total value
 * @returns {number} The percentage as an integer (0-100)
 */
function calculatePercentage(part, total) {
  if (total === 0) return 0;
  return ((part / total) * 100).toFixed();
}
