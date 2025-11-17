/**
 * Shared constants for the Nice Pulls extension
 */

// GitHub repository configuration
const GITHUB_REPO = "drivy/drivy-rails";
const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;

// Timing constants for UI interactions
const TIMING = {
  LABEL_MENU_DELAY: 500,
  GITHUB_UI_DELAY: 300,
  PASTE_DELAY: 500,
  OBSERVER_DEBOUNCE: 100,
  POLLING_INTERVAL: 500
};

// UI Theme constants
const THEME = {
  PURPLE_PRIMARY: "#670070",
  PURPLE_HOVER: "#9800a6"
};

// PR Description constants
const COMMIT_BY_COMMIT_LINE = "  🪜   _Commit by commit_";

// Required locales for translation PRs
const REQUIRED_LOCALES = [
  { file: "en.yml", flag: "🇬🇧" },
  { file: "fr.yml", flag: "🇫🇷" },
  { file: "nb_NO.yml", flag: "🇳🇴" },
  { file: "de.yml", flag: "🇩🇪" },
  { file: "es.yml", flag: "🇪🇸" },
  { file: "nl_BE.yml", flag: "🇧🇪" }
];
