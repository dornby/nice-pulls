// Initialize Refresh All button for PR list page

function initRefreshAllButton() {
  // Find the "New pull request" button container
  const newPrButton = document.querySelector("a[href*='/compare']");
  if (!newPrButton) return;

  // Check if button already exists
  if (document.querySelector("[data-nice-pulls-refresh-all]")) {
    return;
  }

  // Get the parent container to insert our button next to it
  const buttonContainer = newPrButton.parentElement;
  if (!buttonContainer) return;

  // Create the Refresh All button
  const refreshAllButton = document.createElement("button");
  refreshAllButton.className = "btn btn-sm";
  refreshAllButton.type = "button";
  refreshAllButton.textContent = "Refresh all";
  refreshAllButton.dataset.nicePullsRefreshAll = "true";

  // Apply custom styling
  refreshAllButton.style.backgroundColor = "#670070";
  refreshAllButton.style.borderColor = "#670070";
  refreshAllButton.style.color = "white";
  refreshAllButton.style.marginLeft = "8px";
  refreshAllButton.style.fontSize = "14px";

  // Hover effects
  refreshAllButton.addEventListener("mouseenter", () => {
    refreshAllButton.style.backgroundColor = "#9800a6";
    refreshAllButton.style.borderColor = "#9800a6";
  });

  refreshAllButton.addEventListener("mouseleave", () => {
    refreshAllButton.style.backgroundColor = "#670070";
    refreshAllButton.style.borderColor = "#670070";
  });

  // Add click handler
  refreshAllButton.addEventListener("click", onRefreshAllClick);

  // Insert the button right after the New pull request button
  buttonContainer.insertAdjacentElement("afterend", refreshAllButton);
}

async function onRefreshAllClick(event) {
  const button = event.target;
  const originalText = button.textContent;

  try {
    // Update button state
    button.disabled = true;
    button.textContent = "Refreshing...";

    // Show visual feedback
    const notification = createLoadingNotification("Refreshing PRs...", {
      showProgress: true,
      spinnerSize: 20
    });

    // Get all PR links from the list
    const prLinks = Array.from(document.querySelectorAll(".js-navigation-item .Link--primary"))
      .filter(link => link.href.includes("/pull/"))
      .map(link => {
        const prNumber = link.href.split("/pull/")[1].split(/[?#]/)[0];
        return prNumber;
      });

    if (prLinks.length === 0) {
      notification.updateStatus("No PRs found");
      setTimeout(() => {
        notification.remove();
        button.disabled = false;
        button.textContent = originalText;
      }, 2000);
      return;
    }

    notification.updateProgress(`0 / ${prLinks.length} PRs updated`);

    // Refresh each PR
    for (let i = 0; i < prLinks.length; i++) {
      const prNumber = prLinks[i];
      notification.updateProgress(`${i + 1} / ${prLinks.length} PRs updated`);

      try {
        await refreshPR(prNumber);
      } catch (error) {
        console.error(`Error refreshing PR #${prNumber}:`, error);
        // Continue with other PRs even if one fails
      }
    }

    // Update notification to show completion
    notification.updateStatus("All PRs refreshed!");
    notification.updateProgress(`${prLinks.length} PRs updated successfully`);

    // Wait a moment then refresh the page
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

async function refreshPR(prNumber) {
  await refreshPRDescription(prNumber);
}

// Initialize immediately and watch for changes
initializeWithObserver(initRefreshAllButton, {
  debounceMs: 200,
  usePolling: true,
  pollingInterval: 1000
});
