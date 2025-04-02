window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    selectElement: document.querySelector('#legacy-sentence-type-lookup'),
    showAllValues: true,
    autoselect: true,
    confirmOnBlur: false,
    onConfirm: function (selected) {
      const element = document.querySelector('#legacy-sentence-type-lookup')
      const value = element?.value || selected
      if (value) {
        window.location.href = `/sentence-types/legacy/detail?nomisSentenceTypeReference=${encodeURIComponent(value)}`
      }
    },
  })
})
