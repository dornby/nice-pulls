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
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #670070;
      color: white;
      padding: 20px 32px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-weight: 500;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      min-width: 300px;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <svg style="animation: spin 1s linear infinite;" width="20" height="20" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" stroke-dasharray="43.98" stroke-dashoffset="10.99" opacity="0.25"/>
          <path d="M8 1a7 7 0 0 1 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span id="refresh-status">Refreshing PRs...</span>
      </div>
      <div id="refresh-progress" style="font-size: 14px; opacity: 0.9;"></div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(notification);

    const statusEl = notification.querySelector("#refresh-status");
    const progressEl = notification.querySelector("#refresh-progress");

    // Get all PR links from the list
    const prLinks = Array.from(document.querySelectorAll(".js-navigation-item .Link--primary"))
      .filter(link => link.href.includes("/pull/"))
      .map(link => {
        const prNumber = link.href.split("/pull/")[1].split(/[?#]/)[0];
        return prNumber;
      });

    if (prLinks.length === 0) {
      statusEl.textContent = "No PRs found";
      setTimeout(() => {
        notification.remove();
        button.disabled = false;
        button.textContent = originalText;
      }, 2000);
      return;
    }

    progressEl.textContent = `0 / ${prLinks.length} PRs updated`;

    // Refresh each PR
    for (let i = 0; i < prLinks.length; i++) {
      const prNumber = prLinks[i];
      progressEl.textContent = `${i + 1} / ${prLinks.length} PRs updated`;

      try {
        await refreshPR(prNumber);
      } catch (error) {
        console.error(`Error refreshing PR #${prNumber}:`, error);
        // Continue with other PRs even if one fails
      }
    }

    // Update notification to show completion
    statusEl.textContent = "All PRs refreshed!";
    progressEl.textContent = `${prLinks.length} PRs updated successfully`;

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
  // Fetch the PR data
  const files = await fetchAllPRFiles(prNumber);
  const commits = await fetchPRCommits(prNumber);

  // Fetch current PR to get title and body
  const pr = await githubApiCall(`/pulls/${prNumber}`);
  const branchName = pr.head.ref;
  const isBranchTranslation = isTranslationBranch(branchName);

  let updatedBody = pr.body || "";

  if (isBranchTranslation) {
    // Update translation completions
    const completionText = generateLocaleCompletionText(files);
    updatedBody = replaceLocaleCompletion(updatedBody, completionText);
  } else {
    // Update feature PR: specs, commits, and translation status
    const specsPercentage = calculateSpecsPercentageFromFiles(files);
    updatedBody = replaceSpecsPercentage(updatedBody, specsPercentage);
    updatedBody = replaceCommitsWith(commits, updatedBody);

    // Check if all locales are present and update status/labels
    if (areAllLocalesPresent(files)) {
      updatedBody = updateLyriqStatus(updatedBody, STATUS_PATTERNS.DONE);

      // Get current labels
      const currentLabels = pr.labels.map(label => label.name);

      // Swap labels via API if needed
      if (currentLabels.includes("has_translations")) {
        await removeLabelFromPR(prNumber, "has_translations");
        await addLabelToPR(prNumber, "translations_done");
      } else if (!currentLabels.includes("translations_done")) {
        await addLabelToPR(prNumber, "translations_done");
      }
    }
  }

  // Update PR via API
  await updatePullRequest(prNumber, { body: updatedBody });
}

// Initialize immediately and watch for changes
initializeWithObserver(initRefreshAllButton, {
  debounceMs: 200,
  usePolling: true,
  pollingInterval: 1000
});
