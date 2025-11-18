function updateLyriqStatus(content, newStatus) {
  const lyriqLineRegex = /(\n[ \t\u00a0]*♌️[ \t\u00a0]+\[Lyriq Branch\]\([^)]*\))[ \t]*\|[^\n]*/;
  const match = content.match(lyriqLineRegex);

  if (!match) return content;

  const lyriqPrefix = match[1];
  const replacement = `${lyriqPrefix} | ${newStatus.text} ${newStatus.emoji}`;

  return content.replace(lyriqLineRegex, replacement);
}

function areAllLocalesPresent(files) {
  const localeFiles = files.filter(
    file => file.filename.startsWith(LOCALES_PATH) && file.status !== "removed"
  );

  return REQUIRED_LOCALES.every(locale =>
    localeFiles.some(file => file.filename.endsWith(locale.file))
  );
}
