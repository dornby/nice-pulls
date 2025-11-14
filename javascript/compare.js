// Setup
const actionBar = document.querySelector(".d-flex.my-2.mx-md-2.flex-md-justify-end")
const createPrButton = actionBar.children[0]
const textArea = document.getElementById("pull_request_body")
const titleInput = document.getElementById("pull_request_title")
const assignYourselfInput = document.getElementsByName("issue[user_assignee_ids][]")[2]
const commits = document.querySelectorAll(".Link--primary.text-bold.js-navigation-open.markdown-title")
const commitsArray = Array.from(commits)
const commitTitles = commitsArray.map(commit => commit.text)
const joinedCommitTitles = commitTitles.join("\n### ")
var translationLabelIsAdded = false
var listeningForFormatPrButtonSecondClick = false

// Create format button
actionBar.insertAdjacentHTML('afterbegin', createPrButton.outerHTML)
const formatPrButtonGroup = actionBar.children[0]

// Transform format button to make it as we want
formatPrButtonGroup.children[1].remove()

const formatPrButton = formatPrButtonGroup.children[0]

formatPrButton.innerText = "Auto-format"
formatPrButton.type = "button"

formatPrButton.classList.remove("hx_create-pr-button")

formatPrButton.style.backgroundColor = "#670070"
formatPrButton.style.borderColor = "#670070"

formatPrButton.addEventListener('mouseenter', () => {
  formatPrButton.style.backgroundColor = "#9800a6"
})

formatPrButton.addEventListener('mouseleave', () => {
  formatPrButton.style.backgroundColor = "#670070"
})

delete(formatPrButton.dataset.hydroClick)
delete(formatPrButton.dataset.hydroClickHmac)
delete(formatPrButton.dataset.disableInvalid)
delete(formatPrButton.dataset.disableWith)

// Create Issue ID input
actionBar.insertAdjacentHTML(
  'afterbegin',
  // autocomplete="new-password" as a hack to prevent OnePassword from suggesting stuff on the input - no clean other solution apparently
  '<input autocomplete="new-password" class="form-control input-contrast" placeholder="Issue ID" aria-label="Issue ID" autocomplete=off type="text" id="issue_id">'
)
const issueIdInput = actionBar.children[0]

issueIdInput.style.width = "100px"
issueIdInput.style.marginRight = "4px"

// Add hidden modal
const sidebar = document.querySelector(".Layout-sidebar")
sidebar.style.position = "relative"
sidebar.insertAdjacentHTML('afterbegin', `<div style=\"height: ${sidebar.offsetHeight}px;width: ${sidebar.offsetWidth}px;position: absolute;top: 0;left: 0;border: 2px #670070 dotted;border-radius: 12px;display: none;z-index: 99;padding: 50px 30px;background-color: #0d1117;flex-direction: column;justify-content: space-between;\" id=\"format_popin\"></div>`)

const formatPopin = document.getElementById("format_popin")
formatPopin.insertAdjacentHTML('beforeend', `<div id=\"format_popin_headers\" style=\"display: flex;flex-direction: column\"></div>`)
formatPopin.insertAdjacentHTML('beforeend', `<button type=\"button\" id=\"format_popin_button\" style=\"background: none;border: 1px white solid;padding: 10px;border-radius: 5px;\">Format</button>`)

const formatPopinHeaders = document.getElementById("format_popin_headers")
const formatPopinButton = document.getElementById("format_popin_button")

insertCheckbox(formatPopinHeaders, "links", "Links")
insertCheckbox(formatPopinHeaders, "timeline", "Timeline")
insertCheckbox(formatPopinHeaders, "review-guide", "Review Guide")
insertCheckbox(formatPopinHeaders, "context", "Context")
insertCheckbox(formatPopinHeaders, "implementation", "Implementation")
insertCheckbox(formatPopinHeaders, "commits", "Commits")
insertCheckbox(formatPopinHeaders, "screens", "Screens")

// Listen to click on formatPrButton button
formatPrButton.addEventListener('click', onFormatPrButtonClick)

// Listen to inputs in the textArea
textArea.addEventListener('input',  onTextAreaInput)

// Listen to click on formatPrButton button
formatPopinButton.addEventListener('click', onFormatSubmit, { once: true })

// onFormatPrButtonClick()
function onFormatPrButtonClick() {
  if (listeningForFormatPrButtonSecondClick) {
    onFormatSubmit("light")
  } else {
    formatPopin.style.display = "flex"
    listeningForFormatPrButtonSecondClick = true
  }
}

function specsPercentage() {
  const fileInfos = document.querySelectorAll(".file-info")

  let linesCount
  linesCount = 0

  let linesSpecCount
  linesSpecCount = 0

  fileInfos.forEach((fileInfo) => {
    const truncate = fileInfo.querySelector(".Truncate")
    const link = truncate.querySelector("a")
    const diffStats = fileInfo.querySelector(".diffstat")
    const changesString = diffStats.innerText
    const changesInt = parseInt(changesString)

    linesCount = linesCount + changesInt

    if (link.title.includes("_spec.rb")) {
      linesSpecCount = linesSpecCount + changesInt
    }
  })

  return ((linesSpecCount / linesCount) * 100).toFixed()
}

// onFormatSubmit()
function onFormatSubmit(format) {
  formatPopin.style.display = "none"
  listeningForFormatPrButtonSecondClick = false
  const issueId = issueIdInput.value

  if (issueId) {
    const newTitle = ` [#${issueId}]`
    titleInput.value = newTitle
    textArea.value = newText(issueId, specsPercentage())
  } else {
    textArea.value = newText(null, specsPercentage())
  }
  textArea.style.height = "350px"

  titleInput.focus()
  titleInput.setSelectionRange(0, 0)

  assignYourselfInput.click()

  function newText(issueId, specsPercentage) {
    const linksHeader = `## Links`
    const linksIssue = `\n  🚧   [Issue](https://github.com/drivy/drivy-rails/issues/${issueIdInput.value})`
    const linksWithoutIssue = `\n  📝   [PRD]()\n  🌍   [Translation Job]() & [Slack]() | _Not yet started_ 👻\n  🎨   [Figma]()\n  💬   [Slack]()\n  🐛   [Bugsnag]()`

    if (format === "light") {
      if (issueId) {
        links = linksHeader + linksIssue + linksWithoutIssue
        return `${links}\n## Context`
      } else {
        links = linksHeader + linksWithoutIssue
        return `${links}\n## Context`
      }
    } else {
      var newText = ""

      if (document.getElementById("links-checkbox").checked) {
        if (issueId) {
          links = linksHeader + linksIssue + linksWithoutIssue
          newText += `${links}\n`
        } else {
          links = linksHeader + linksWithoutIssue
          newText += `${links}\n`
        }
      }

      if (document.getElementById("timeline-checkbox").checked) {
        newText += `## Timeline\n* Previous PR: _None_\n* Followup PR: _None_\n`
      }

      if (document.getElementById("review-guide-checkbox").checked) {
        newText += `## Review Guide\n  🪜   Commit by commit\n  👁️‍🗨️   Hide whitespaces\n  🌈   _${specsPercentage}% of the diff is specs_\n`
      }

      if (document.getElementById("context-checkbox").checked) {
        newText += `## Context\n`
      }

      if (document.getElementById("implementation-checkbox").checked) {
        newText += `## Implementation\n`
      }

      if (document.getElementById("commits-checkbox").checked) {
        newText += `## Commits\n### ${joinedCommitTitles}\n`
      }

      if (document.getElementById("screens-checkbox").checked) {
        newText += `## Screens\n| Before | After |\n| --- | --- |\n| <img src=""> | <img src=""> |\n| <video src=""> | <video src=""> |`
      }

      return newText
    }
  }
}

// onTextAreaInput()
function onTextAreaInput() {
  if (textArea.value.includes("[Translations](https://fr.getaround.com/admin/translations/") && !translationLabelIsAdded) {
    const labelsSelectWheel = document.getElementById("labels-select-menu").children[0]

    labelsSelectWheel.click()

    setTimeout(function(){
      const pendingTranslationsLabel = document.querySelector("input[data-label-name='pending-translations']")

      pendingTranslationsLabel.click()
      labelsSelectWheel.click()

      translationLabelIsAdded = true
    }, 500);
  }
}

function insertCheckbox(formatPopinHeaders, name, label) {
  formatPopinHeaders.insertAdjacentHTML(
    'beforeend',
    `<div style=\"display: flex;margin-bottom: 4px;align-items: center\"><input type=\"checkbox\" id=\"${name}-checkbox\" name=\"${name}\" checked style=\"margin-right: 10px;\"><label for=\"${name}\" style=\"font-size: 18px;color: white;font-weight: 300;\">${label}</label></div>`
  )
}
