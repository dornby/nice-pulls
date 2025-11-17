/**
 * Label management utilities for GitHub PR labels
 */

/**
 * Checks if a label is already added to the PR
 * @param {string} labelName - The data-name attribute value
 * @returns {boolean} True if label is present
 */
function hasLabel(labelName) {
  const labelSelectMenu = document.getElementById("labels-select-menu");
  if (!labelSelectMenu) return false;

  const label = labelSelectMenu.parentElement.querySelector(`a[data-name="${labelName}"]`);
  return !!label;
}
