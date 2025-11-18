function hasLabel(labelName) {
  const labelSelectMenu = document.getElementById("labels-select-menu");
  if (!labelSelectMenu) return false;

  const label = labelSelectMenu.parentElement.querySelector(`a[data-name="${labelName}"]`);
  return !!label;
}
