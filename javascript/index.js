function initRefreshCheckedButton() {
  // Only run on the assigned PRs page
  if (!window.location.pathname.includes('/pulls/assigned/')) {
    console.debug('[Nice Pulls] Not on assigned PRs page, skipping refresh button');
    return;
  }

  const newPrButton = document.querySelector(SELECTORS.NEW_PR_BUTTON);
  if (!newPrButton || document.querySelector("[data-nice-pulls-refresh-checked]")) {
    return;
  }

  const buttonContainer = newPrButton.parentElement;
  if (!buttonContainer) {
    console.error('[Nice Pulls] Button container not found');
    return;
  }

  const refreshCheckedButton = document.createElement("button");
  refreshCheckedButton.className = "btn btn-sm";
  refreshCheckedButton.type = "button";
  refreshCheckedButton.textContent = "Refresh checked";
  refreshCheckedButton.dataset.nicePullsRefreshChecked = "true";

  applyPurpleButtonStyle(refreshCheckedButton);
  refreshCheckedButton.style.color = "white";
  refreshCheckedButton.style.marginLeft = "8px";
  refreshCheckedButton.style.fontSize = "14px";

  refreshCheckedButton.addEventListener("click", onRefreshCheckedClick);
  buttonContainer.insertAdjacentElement("afterend", refreshCheckedButton);
}

async function onRefreshCheckedClick(event) {
  const button = event.target;
  const originalText = button.textContent;

  try {
    button.disabled = true;
    button.textContent = "Refreshing...";

    const notification = createLoadingNotification("Refreshing PRs...", {
      showProgress: true,
      spinnerSize: 20
    });

    const selectedRows = Array.from(document.querySelectorAll(SELECTORS.SELECTED_PR_ROW));
    const prLinks = selectedRows
      .map(row => row.querySelector(SELECTORS.PR_LIST_ITEM))
      .filter(link => link && link.href.includes("/pull/"))
      .map(link => link.href.split("/pull/")[1].split(/[?#]/)[0]);

    if (prLinks.length === 0) {
      notification.updateStatus("No checked PRs found");
      setTimeout(() => {
        notification.remove();
        button.disabled = false;
        button.textContent = originalText;
      }, 2000);
      return;
    }

    notification.updateProgress(`0 / ${prLinks.length} PRs updated`);

    for (let i = 0; i < prLinks.length; i++) {
      const prNumber = prLinks[i];
      notification.updateProgress(`${i + 1} / ${prLinks.length} PRs updated`);

      try {
        await refreshPRDescription(prNumber);
      } catch (error) {
        console.error(`Error refreshing PR #${prNumber}:`, error);
      }
    }

    notification.updateStatus("All PRs refreshed!");
    notification.updateProgress(`${prLinks.length} PRs updated successfully`);

    setTimeout(() => {
      window.location.reload();
    }, 1500);

  } catch (error) {
    console.error("Error refreshing PRs:", error);
    alert(`Error refreshing PRs: ${error.message}`);
    button.disabled = false;
    button.textContent = originalText;
  }
}

initializeWithObserver(initRefreshCheckedButton, {
  debounceMs: 200,
  usePolling: true,
  pollingInterval: 1000
});
