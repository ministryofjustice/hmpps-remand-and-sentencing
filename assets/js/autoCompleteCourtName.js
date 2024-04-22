window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    defaultValue: document.getElementById('autocomplete-script').dataset.courtName,
    selectElement: document.querySelector('#court-name'),
    menuClasses: 'govuk-body',
  })
})
