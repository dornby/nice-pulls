// Extract repo from current URL (e.g., "drivy/drivy-rails" from "https://github.com/drivy/drivy-rails/...")
const getRepoFromUrl = () => {
  const match = window.location.pathname.match(/^\/([^\/]+\/[^\/]+)/);
  return match ? match[1] : null;
};

const GITHUB_REPO = getRepoFromUrl();
const GITHUB_REPO_URL = GITHUB_REPO ? `https://github.com/${GITHUB_REPO}` : '';
const GITHUB_API_BASE = GITHUB_REPO ? `https://api.github.com/repos/${GITHUB_REPO}` : '';

const TIMING = {
  PASTE_DELAY: 500,
  OBSERVER_DEBOUNCE: 100,
  POLLING_INTERVAL: 500
};

const THEME = {
  PURPLE_PRIMARY: "#670070",
  PURPLE_HOVER: "#9800a6"
};

const SELECTORS = {
  PR_BODY_TEXTAREA: "pull_request[body]",
  PR_TITLE_INPUT: "pull_request[title]",
  BASE_REF_SELECTOR: "#base-ref-selector",
  HEAD_REF_SELECTOR: "#head-ref-selector",
  BUTTON_LABEL: ".Button-label",
  HEAD_REF_CLASS: ".head-ref",
  GH_HEADER_ACTIONS: ".prc-PageHeader-Actions-wawWm",
  NEW_PR_BUTTON: "a[href*='/compare']",
  PR_LIST_ITEM: ".js-navigation-item .Link--primary",
  SELECTED_PR_ROW: ".js-issue-row.selected",
  FILE_INFO: ".file-info",
  DIFFSTAT: ".diffstat",
  TRUNCATE_LINK: ".Truncate a",
  COMMIT_TITLE: ".Link--primary.text-bold.js-navigation-open.markdown-title",
  CREATE_PR_BUTTON: ".hx_create-pr-button",
  DIFF_FILE: "[data-tagsearch-path]"
};

const COMMIT_BY_COMMIT_LINE = "\u00a0\u00a0🪜\u00a0\u00a0\u00a0_Commit by commit_";
const LYRIQ_BRANCH_LINE = "\u00a0\u00a0♌️\u00a0\u00a0\u00a0[Lyriq Branch]() | _Not yet started_ 👻";
const SLACK_LINE = "\n\u00a0\u00a0💬\u00a0\u00a0\u00a0[Slack]()";
const SPECS_LINE = (specsPercentage) => `\u00a0\u00a0🌈\u00a0\u00a0\u00a0_${specsPercentage}% of the diff is specs_`;

const REQUIRED_LOCALES = [
  { file: "en.yml", flag: "🇬🇧" },
  { file: "fr.yml", flag: "🇫🇷" },
  { file: "nb_NO.yml", flag: "🇳🇴" },
  { file: "de.yml", flag: "🇩🇪" },
  { file: "es.yml", flag: "🇪🇸" },
  { file: "nl_BE.yml", flag: "🇧🇪" }
];

const STATUS_PATTERNS = {
  NOT_YET_STARTED: { text: "_Not yet started_", emoji: "👻" },
  IN_PROGRESS: { text: "_In progress_", emoji: "⏳" },
  DONE: { text: "_Done_", emoji: "✅" },
};

const LOCALES_PATH = "config/locales/";
const SPEC_FILE_PATTERN = "_spec.rb";
const TRANSLATION_BRANCH_PREFIX = "translations/";
const FIX_BRANCH_PREFIX = "fix/";
const EN_YML = "en.yml";
const GITHUB_ITEMS_PER_PAGE = 30;

const LABELS = {
  LYRIQ: "lyriq",
  HAS_TRANSLATIONS: "has_translations",
  TRANSLATIONS_DONE: "translations_done"
};
