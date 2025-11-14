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
const labelsSelectWheel = document.getElementById("labels-select-menu").children[0]
var translationLabelIsAdded = false

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

// Add hidden modal
const sidebar = document.querySelector(".Layout-sidebar")
sidebar.style.position = "relative"
sidebar.insertAdjacentHTML('afterbegin', `<div style=\"height: ${sidebar.offsetHeight}px;width: ${sidebar.offsetWidth}px;position: absolute;top: 0;left: 0;border: 2px #670070 dotted;border-radius: 12px;display: none;z-index: 99;padding: 50px 30px;background-color: #0d1117;flex-direction: column;justify-content: space-between;\" id=\"format_popin\"></div>`)

// Listen to click on formatPrButton button
formatPrButton.addEventListener('click', onFormatPrButtonClick)

// Listen to inputs in the textArea
textArea.addEventListener('input',  onTextAreaInput)

// featureText()
function featureText(specsPercentage) {
  var newText = ""
  newText += `## Links\n  📝   [PRD]()\n  ♌️   [Lyriq Branch]() | _Not yet started_ 👻\n  🎨   [Figma]()\n  🪸   [Deep Dive]()\n  💬   [Slack]()\n  🐛   [Bugsnag]()\n\n`
  newText += `## Timeline\n* Previous PR: _None_\n* Followup PR: _None_\n\n`
  newText += `## Review Guide\n  🪜   Commit by commit\n  🌈   _${specsPercentage}% of the diff is specs_\n\n`
  newText += `## Context\n\n`
  newText += `## Implementation\n\n`
  newText += `## Commits\n### ${joinedCommitTitles}\n\n`
  newText += `## Screens\n| Before | After |\n| --- | --- |\n| <img src=""> | <img src=""> |\n| <video src=""> | <video src=""> |`
  return newText
}

// translationsText()
function translationsText() {
  var newText = ""
  newText += `> [!NOTE]\n> _This PR will not be merged onto main, it's sole purpose is to receive Lyriq translations. The Lyriq commits will then be cherry-picked in the feature branch._\n\n`
  newText += `## Links\n👑  [Feature Branch]()\n💬  [Slack]()\n♌️  [Lyriq job]()\n\n`
  newText += `## Completion\n- [x] 🇬🇧\n- [ ] 🇫🇷\n- [ ] 🇳🇴\n- [ ] 🇩🇪\n- [ ] 🇪🇸\n- [ ] 🇧🇪\n`
  return newText
}

// onFormatPrButtonClick()
function onFormatPrButtonClick() {
  const branchName = document.getElementById('head-ref-selector').querySelector('.Button-label').children[1].innerText

  if (branchName.includes('translations/')) {
    textArea.value = translationsText()
    titleInput.value = "♌️ "

    labelsSelectWheel.click()

    setTimeout(function(){
      const pendingTranslationsLabel = document.querySelector("input[data-label-name='lyriq']")

      pendingTranslationsLabel.click()
      labelsSelectWheel.click()
    }, 500);
  } else {
    textArea.value = featureText(specsPercentage())
  }

  textArea.style.height = "350px"
  titleInput.focus()
  titleInput.setSelectionRange(0, 0)

  assignYourselfInput.click()
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

// onTextAreaInput()
function onTextAreaInput() {
  if (textArea.value.includes("[Lyriq Branch](https://github.com/drivy/drivy-rails/pull/") && !translationLabelIsAdded) {
    labelsSelectWheel.click()

    setTimeout(function(){
      const pendingTranslationsLabel = document.querySelector("input[data-label-name='has_translations']")

      pendingTranslationsLabel.click()
      labelsSelectWheel.click()

      translationLabelIsAdded = true
    }, 500);
  }
}
