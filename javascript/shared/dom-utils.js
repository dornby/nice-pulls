/**
 * DOM utility functions for manipulating GitHub UI elements
 */

/**
 * Creates a custom styled button with purple theme
 * @param {HTMLElement} sourceButton - Button to clone from
 * @param {string} buttonText - Text for the button
 * @param {Function} clickHandler - Click event handler
 * @returns {HTMLElement} The styled button element
 */
function createStyledButton(sourceButton, buttonText, clickHandler) {
  const buttonGroup = document.createElement('div');
  buttonGroup.innerHTML = sourceButton.outerHTML;

  const button = buttonGroup.children[0];
  button.innerText = buttonText;
  button.type = "button";
  button.classList.remove("hx_create-pr-button");

  applyPurpleButtonStyle(button);

  delete button.dataset.hydroClick;
  delete button.dataset.hydroClickHmac;
  delete button.dataset.disableInvalid;
  delete button.dataset.disableWith;

  if (clickHandler) {
    button.addEventListener('click', clickHandler);
  }

  return buttonGroup;
}

/**
 * Applies custom purple button styling with hover effects
 * @param {HTMLElement} button - Button element to style
 */
function applyPurpleButtonStyle(button) {
  button.style.backgroundColor = "#670070";
  button.style.borderColor = "#670070";

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = "#9800a6";
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = "#670070";
  });
}

/**
 * Gets the current branch name from the GitHub UI
 * @param {string} context - 'compare' or 'pull' to determine which selector to use
 * @returns {string} The branch name
 */
function getHeadRefName(context) {
  if (context === 'compare') {
    return document.getElementById('head-ref-selector')
      .querySelector('.Button-label')
      .children[1].innerText;
  } else if (context === 'pull') {
    return document.getElementsByClassName("head-ref")[0].title;
  }
  return '';
}

function getBaseRefName(context) {
  return document.getElementById('base-ref-selector')
    .querySelector('.Button-label')
    .children[1].innerText
};

/**
 * Gets the pull request ID from the current URL
 * @returns {string} The PR ID
 */
function getPullRequestId() {
  return window.location.href.split("pull/")[1];
}

/**
 * Auto-resizes textarea and focuses with cursor at end
 * @param {HTMLElement} textArea - The textarea element
 * @param {HTMLElement} titleInput - The title input element
 */
function focusAndResizeTextArea(textArea, titleInput) {
  textArea.style.height = "350px";
  titleInput.focus();
  const length = titleInput.value.length;
  titleInput.setSelectionRange(length, length);
}

/**
 * Selects draft mode for PR creation and updates button styling
 */
function selectDraftMode() {
  const draftRadio = document.getElementById('draft_on');
  if (draftRadio && !draftRadio.checked) {
    draftRadio.click();

    // Update the button text and style to reflect draft mode
    const createPrButton = document.querySelector('.hx_create-pr-button');
    if (createPrButton) {
      createPrButton.style.backgroundColor = '#6e7781';
      createPrButton.style.borderColor = '#6e7781';
    }

    // Update the dropdown arrow button style
    const dropdownButton = document.querySelector('.select-menu-button.btn-primary');
    if (dropdownButton) {
      dropdownButton.style.backgroundColor = '#6e7781';
      dropdownButton.style.borderColor = '#6e7781';
    }
  }
}
