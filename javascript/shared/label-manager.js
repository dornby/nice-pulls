/**
 * Label management utilities for GitHub PR labels
 */

/**
 * Adds a label to the current PR
 * @param {string} labelName - The data-label-name attribute value
 * @returns {Promise<void>}
 */
async function addLabel(labelName) {
  const labelsSelectWheel = document.getElementById("labels-select-menu").children[0];

  return new Promise((resolve) => {
    labelsSelectWheel.click();

    setTimeout(() => {
      const labelInput = document.querySelector(`input[data-label-name="${labelName}"]`);
      if (labelInput && !labelInput.checked) {
        labelInput.click();
      }
      labelsSelectWheel.click();
      resolve();
    }, TIMING.LABEL_MENU_DELAY);
  });
}

/**
 * Swaps one label for another in a single operation
 * @param {string} labelToRemove - The data-label-name attribute value to remove
 * @param {string} labelToAdd - The data-label-name attribute value to add
 * @returns {Promise<void>}
 */
async function swapLabels(labelToRemove, labelToAdd) {
  const labelsSelectWheel = document.getElementById("labels-select-menu").children[0];

  return new Promise((resolve) => {
    labelsSelectWheel.click();

    setTimeout(() => {
      // Remove the old label
      const removeInput = document.querySelector(`input[data-label-name="${labelToRemove}"]`);
      if (removeInput && removeInput.checked) {
        removeInput.click();
      }

      // Add the new label
      const addInput = document.querySelector(`input[data-label-name="${labelToAdd}"]`);
      if (addInput && !addInput.checked) {
        addInput.click();
      }

      labelsSelectWheel.click();
      resolve();
    }, TIMING.LABEL_MENU_DELAY);
  });
}

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
