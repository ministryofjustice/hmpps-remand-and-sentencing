window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    selectElement: document.querySelector('#offence-outcome'),
    menuClasses: 'govuk-body',
  })
})
