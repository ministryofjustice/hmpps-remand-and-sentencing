window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    selectElement: document.querySelector('#legacy-sentence-type-lookup'),
    showAllValues: true,
    defaultValue: '',
    placeholder: 'Start typing…',
    autoselect: true,
    confirmOnBlur: false,
    onConfirm: function (selected) {
      const value = document.querySelector('#legacy-sentence-type-lookup').value
      if (value) {
        window.location.href = `/sentence-types/legacy/detail?nomisSentenceTypeReference=${encodeURIComponent(value)}`
      }
    },
  })
})
