/**
 * Status update utilities for PR description templates
 */

/**
 * Status definitions for the Lyriq Branch line
 */
const STATUS_PATTERNS = {
  NOT_YET_STARTED: { text: "_Not yet started_", emoji: "👻" },
  IN_PROGRESS: { text: "_In progress_", emoji: "⏳" },
  DONE: { text: "_Done_", emoji: "✅" },
};

/**
 * Updates the Lyriq Branch status in the PR description
 * @param {string} content - The PR description content
 * @param {Object} newStatus - The new status object from STATUS_PATTERNS
 * @returns {string} The updated content
 */
function updateLyriqStatus(content, newStatus) {
  // Match the Lyriq Branch line with any status pattern
  const lyriqLineRegex = /♌️\s+\[Lyriq Branch\]\([^)]*\)\s*\|\s*[^\n]+/;

  // Extract the URL from the existing line if present
  const match = content.match(/♌️\s+\[Lyriq Branch\]\(([^)]*)\)/);
  const url = match ? match[1] : "";

  // Create the new line with the updated status
  const newLine = `♌️   [Lyriq Branch](${url}) | ${newStatus.text} ${newStatus.emoji}`;

  return content.replace(lyriqLineRegex, newLine);
}

/**
 * Checks if all required locales are present in the files
 * @param {Array} files - Array of file objects from GitHub API
 * @returns {boolean} True if all locales are present
 */
function areAllLocalesPresent(files) {
  const localeFiles = files.filter(
    file => file.filename.startsWith("config/locales/") && file.status !== "removed"
  );

  return REQUIRED_LOCALES.every(locale =>
    localeFiles.some(file => file.filename.endsWith(locale.file))
  );
}
