import secrets from "../secrets.json";

// Setup

const githubBearerToken = secrets.github_bearer_token
const labelSelectMenu = document.getElementById("labels-select-menu")
const translationLabel = labelSelectMenu.parentElement.querySelector("a[data-name=has_translations]")

if (translationLabel) {
  var translationLabelIsAdded = true
} else {
  var translationLabelIsAdded = false
}

// onPaste()
function onPaste(event) {
  const pastedText = (event.clipboardData || window.clipboardData).getData('text')

  if (pastedText) {
    if (pastedText.includes("https://app.phrase.com/") && !translationLabelIsAdded) {
      const labelsSelectWheel = document.getElementById("labels-select-menu").children[0]

      labelsSelectWheel.click()

      setTimeout(function(){
        const hasTranslationsLabel = document.querySelector("input[data-label-name='has_translations']")

        if (hasTranslationsLabel) {
          hasTranslationsLabel.click()
          labelsSelectWheel.click()
          translationLabelIsAdded = true
        }
      }, 500);
    }
  }
}

function fetchFilesAndReplaceSpecsWithPercentage(pullID, page, presentFiles = []) {
  return fetch(`https://api.github.com/repos/drivy/drivy-rails/pulls/${pullID}/files?page=${page}`, {
    headers: {
      Authorization: `Bearer ${githubBearerToken}`,
    }
  })
    .then((response) => response.json())
    .then((files) => {
      if (files.length === 30) {
        fetchFilesAndReplaceSpecsWithPercentage(pullID, page + 1, presentFiles.concat(files))
      } else {
        return replaceSpecsWith(getSpecsPercentageFrom(presentFiles.concat(files)))
      }
    })
    .then((newContent) => fetchCommitsAndEditDesc(pullID, newContent))
}

function fetchCommitsAndEditDesc(pullID, textAreaContent) {
  fetch(`https://api.github.com/repos/drivy/drivy-rails/pulls/${pullID}/commits`, {
    headers: {
      Authorization: `Bearer ${githubBearerToken}`,
    }
  })
    .then((response) => response.json())
    .then((commits) => replaceCommitsWith(commits, textAreaContent))
}

function getSpecsPercentageFrom(files) {
  let linesCount
  linesCount = 0

  let linesSpecCount
  linesSpecCount = 0

  files.forEach((file) => {
    linesCount = linesCount + file.changes

    if (file.filename.includes("_spec.rb")) {
      linesSpecCount = linesSpecCount + file.changes
    }
  })

  return ((linesSpecCount / linesCount) * 100).toFixed()
}

function replaceSpecsWith(specsPercentage) {
  const textArea = document.getElementsByName("pull_request[body]")[0]
  const splitContent = textArea.textContent.split("% of the diff is specs_")
  const firstSplitContent = splitContent[0]
  const splitFirstSplitContent = firstSplitContent.split("🌈   _")
  const beforeSpecs = splitFirstSplitContent[0]
  const afterSpecs = splitContent[1]
  const newContent = `${beforeSpecs}🌈   _${specsPercentage}% of the diff is specs_${afterSpecs}`

  return newContent
}

function replaceCommitsWith(commits, textAreaContent) {
  const textArea = document.getElementsByName("pull_request[body]")[0]
  if (textAreaContent) {
    const hasCommitsTitle = textAreaContent.includes("## Commits")
    const splitContent = textAreaContent.split("## Commits")

    const beforeCommitsTitleContent = splitContent[0]
    const afterCommitsTitleContent = splitContent[1]

    if (hasCommitsTitle) {
      const splitAfterCommitsTitleContent = afterCommitsTitleContent ?
        afterCommitsTitleContent.split("\n## ") :
        []

      const commitsContent = afterCommitsTitleContent ?
        splitAfterCommitsTitleContent[0] :
        ""

      const afterCommitsContent = afterCommitsTitleContent ?
        splitAfterCommitsTitleContent.slice(1).join("\n## ") :
        ""

      const commitsContentSplited = commitsContent.split("\n### ")

      const commitsToKeep = commitsContentSplited.filter((commit) => notAnEmptyCommit(commit))

      let commitsCleanedContent = ""

      commitsToKeep.forEach((commit) => {
        commitsCleanedContent += `\n### ${commit}`
      })

      let newCommitsContent = ""

      commits.forEach((commit) => {
        const commitMessage = commit.commit.message

        if (addToNewCommits(commitsContent, commitMessage)) {
          newCommitsContent += `\n### ${commitMessage}`
        }
      })

      const newContent = afterCommitsContent ?
        beforeCommitsTitleContent + "## Commits" + commitsCleanedContent + newCommitsContent + "\n## " + afterCommitsContent :
        beforeCommitsTitleContent + "## Commits" + commitsCleanedContent + newCommitsContent

      textArea.value = newContent
    } else {
      textArea.value = textAreaContent
    }
  }
}

function notAnEmptyCommit(commit) {
  const partAfterFirstBreak = commit.split("\n")[1]

  if (partAfterFirstBreak) {
    return partAfterFirstBreak !== ""
  } else {
    return false
  }
}

function addToNewCommits(commitsContent, commitMessage) {
  if (commitsContent.includes(commitMessage)) {
    const linesFollowingCommitMessage = commitsContent.split(commitMessage)[1].split("\n")
    const linesFollowingCommitMessageWithoutEmptyLines = linesFollowingCommitMessage.filter((line) => line !== "")
    const firstLineFollowingCommitMessage = linesFollowingCommitMessageWithoutEmptyLines[0]
    if (firstLineFollowingCommitMessage) {
      return firstLineFollowingCommitMessage.includes("###")
    } else {
      return true
    }
  } else {
    return true
  }
}

// Listen to inputs in the textArea
document.addEventListener('paste',  (event) => { onPaste(event) })

const actions = document.querySelector(".gh-header-actions")
const editButton = actions.children[0]
editButton.insertAdjacentHTML("beforebegin", editButton.outerHTML)
const refreshButton = actions.children[0]
refreshButton.innerHTML = "Refresh desc"
refreshButton.ariaLabel = null
refreshButton.dataset.gaClick = null
refreshButton.classList.remove("js-details-target", "js-title-edit-button")

refreshButton.style.backgroundColor = "#670070"
refreshButton.style.borderColor = "#670070"

refreshButton.addEventListener('mouseenter', () => {
  refreshButton.style.backgroundColor = "#9800a6"
})

refreshButton.addEventListener('mouseleave', () => {
  refreshButton.style.backgroundColor = "#670070"
})

refreshButton.addEventListener("click", () => {
  const pullID = window.location.href.split("pull/")[1]

  fetchFilesAndReplaceSpecsWithPercentage(pullID, 1)
})
