window.addEventListener('load', function () {
  const selectElement = document.querySelector('#legacy-sentence-type-lookup')

  accessibleAutocomplete.enhanceSelectElement({
    selectElement: selectElement,
    showAllValues: true,
    autoselect: true,
    confirmOnBlur: false,
    onConfirm: function (selected) {
      if (!selected || !selectElement) return
      const matchingOption = Array.from(selectElement.options).find(opt => opt.textContent === selected)
      const value = matchingOption?.value
      if (value) {
        window.location.href = `/sentence-types/legacy/detail?nomisSentenceTypeReference=${encodeURIComponent(value)}`
      }
    },
  })
})
