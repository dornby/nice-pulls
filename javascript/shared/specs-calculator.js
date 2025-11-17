/**
 * Spec percentage calculation utilities
 */

/**
 * Generic specs percentage calculator
 * @param {Array} items - Array of items to calculate from
 * @param {Function} getChanges - Function to extract changes count from item
 * @param {Function} getFilename - Function to extract filename from item
 * @returns {number} The percentage (0-100) as an integer
 */
function calculateSpecsPercentage(items, getChanges, getFilename) {
  let linesCount = 0;
  let linesSpecCount = 0;

  items.forEach((item) => {
    const changes = getChanges(item);
    const filename = getFilename(item);

    linesCount += changes;
    if (filename.includes("_spec.rb")) {
      linesSpecCount += changes;
    }
  });

  return calculatePercentage(linesSpecCount, linesCount);
}

/**
 * Calculates the percentage of spec lines in a PR from DOM elements
 * @returns {number} The percentage (0-100) as an integer
 */
function calculateSpecsPercentageFromDOM() {
  const fileInfos = Array.from(document.querySelectorAll(".file-info"));

  return calculateSpecsPercentage(
    fileInfos,
    (fileInfo) => parseInt(fileInfo.querySelector(".diffstat").innerText),
    (fileInfo) => fileInfo.querySelector(".Truncate a").title
  );
}

/**
 * Calculates the percentage of spec lines from GitHub API file objects
 * @param {Array} files - Array of file objects from GitHub API
 * @returns {number} The percentage (0-100) as an integer
 */
function calculateSpecsPercentageFromFiles(files) {
  return calculateSpecsPercentage(
    files,
    (file) => file.changes,
    (file) => file.filename
  );
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
