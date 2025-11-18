function createStyledButton(sourceButton, buttonText, clickHandler) {
  const buttonGroup = document.createElement("div");
  buttonGroup.innerHTML = sourceButton.outerHTML;

  const button = buttonGroup.children[0];
  button.innerText = buttonText;
  button.type = "button";
  button.classList.remove("hx_create-pr-button");

  applyPurpleButtonStyle(button);
  cleanButtonDataAttributes(button);

  if (clickHandler) {
    button.addEventListener("click", clickHandler);
  }

  return buttonGroup;
}

function cleanButtonDataAttributes(button) {
  delete button.dataset.hydroClick;
  delete button.dataset.hydroClickHmac;
  delete button.dataset.disableInvalid;
  delete button.dataset.disableWith;
}

function applyPurpleButtonStyle(button) {
  button.style.backgroundColor = THEME.PURPLE_PRIMARY;
  button.style.borderColor = THEME.PURPLE_PRIMARY;

  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = THEME.PURPLE_HOVER;
    button.style.borderColor = THEME.PURPLE_HOVER;
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = THEME.PURPLE_PRIMARY;
    button.style.borderColor = THEME.PURPLE_PRIMARY;
  });
}

function getHeadRefName(context) {
  if (context === "compare") {
    return document.querySelector(SELECTORS.HEAD_REF_SELECTOR)
      .querySelector(SELECTORS.BUTTON_LABEL)
      .children[1].innerText;
  }
  return document.querySelector(SELECTORS.HEAD_REF_CLASS).title;
}

function getBaseRefName() {
  return document.querySelector(SELECTORS.BASE_REF_SELECTOR)
    .querySelector(SELECTORS.BUTTON_LABEL)
    .children[1].innerText;
}

function getPullRequestId() {
  return window.location.href.split("pull/")[1];
}

function isTranslationBranch(branchName) {
  return branchName.includes(TRANSLATION_BRANCH_PREFIX);
}

function isFixBranch(branchName) {
  return branchName.startsWith(FIX_BRANCH_PREFIX);
}

function createLoadingNotification(message, options = {}) {
  const { showProgress = false, spinnerSize = 16 } = options;

  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${THEME.PURPLE_PRIMARY};
    color: white;
    padding: ${showProgress ? '20px 32px' : '16px 24px'};
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    font-weight: 500;
    display: flex;
    ${showProgress ? 'flex-direction: column;' : ''}
    align-items: center;
    gap: ${showProgress ? '16px' : '12px'};
    ${showProgress ? 'min-width: 300px;' : ''}
  `;

  const spinnerHTML = `
    <svg style="animation: spin 1s linear infinite;" width="${spinnerSize}" height="${spinnerSize}" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" stroke-dasharray="43.98" stroke-dashoffset="10.99" opacity="0.25"/>
      <path d="M8 1a7 7 0 0 1 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  notification.innerHTML = showProgress ? `
    <div style="display: flex; align-items: center; gap: 12px;">
      ${spinnerHTML}
      <span id="notification-status">${message}</span>
    </div>
    <div id="notification-progress" style="font-size: 14px; opacity: 0.9;"></div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  ` : `
    ${spinnerHTML}
    <span id="notification-status">${message}</span>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `;

  document.body.appendChild(notification);

  return {
    element: notification,
    updateStatus: (newMessage) => {
      const statusEl = notification.querySelector("#notification-status");
      if (statusEl) statusEl.textContent = newMessage;
    },
    updateProgress: (progressText) => {
      const progressEl = notification.querySelector("#notification-progress");
      if (progressEl) progressEl.textContent = progressText;
    },
    remove: () => notification.remove()
  };
}

function initializeWithObserver(initFunction, options = {}) {
  const {
    target = document.querySelector("main") || document.body,
    observerOptions = { childList: true, subtree: false },
    debounceMs = TIMING.OBSERVER_DEBOUNCE,
    usePolling = false,
    pollingInterval = TIMING.POLLING_INTERVAL
  } = options;

  initFunction();

  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(initFunction, debounceMs);
  });
  observer.observe(target, observerOptions);

  if (usePolling) {
    setInterval(initFunction, pollingInterval);
  }
}

function hasEnYmlInDOM() {
  return Array.from(document.querySelectorAll(SELECTORS.FILE_INFO)).some((fileInfo) => {
    const filename = fileInfo.querySelector(SELECTORS.TRUNCATE_LINK)?.title || "";
    return filename.endsWith(EN_YML) && filename.startsWith(LOCALES_PATH);
  });
}
