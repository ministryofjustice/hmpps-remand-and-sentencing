window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    defaultValue: document.getElementById('autocomplete-script').dataset.nextHearingCourtName,
    selectElement: document.querySelector('#next-hearing-court-name'),
    menuClasses: 'govuk-body',
  })
})
