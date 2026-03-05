function debounce(fn, delay) {
  let timer = null
  return function () {
    const context = this
    const args = arguments
    clearTimeout(timer)
    timer = setTimeout(function () {
      fn.apply(context, args)
    }, delay)
  }
}

const request = new XMLHttpRequest()

window.addEventListener('load', function () {
  const select = document.querySelector('#court-name')
  const courtCodeInput = document.getElementById('court-code')
  const defaultCourt = document
    .getElementById('autocomplete-script')
    .dataset.court

  accessibleAutocomplete({
    element: select.parentElement,
    id: 'court-name',
    name: 'courtName',
    defaultValue: defaultCourt,
    confirmOnBlur: false,
    minLength: 3,
    displayMenu: 'overlay',
    inputClasses: 'govuk-input',
    menuClasses: 'govuk-body',

    source: debounce(function (query, populateResults) {
      const request = new XMLHttpRequest()
      request.open(
        'GET',
        '/api/search-court?searchString=' + query,
        true
      )
      request.timeout = 2000

      request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            populateResults(JSON.parse(request.responseText))
          } else {
            populateResults([{ unableToLoad: true }])
          }
        }
      }

      request.send()
    }, 100),

    onConfirm: function (confirmed) {
      if (confirmed && confirmed.courtId) {
        courtCodeInput.value = confirmed.courtId
      } else {
        courtCodeInput.value = ''
      }
    },

    templates: {
      inputValue: function (result) {
        return result && result.courtName ? result.courtName : ''
      },
      suggestion: function (result) {
        if (result && result.unableToLoad) {
          return 'No results found'
        }
        if (typeof result === 'string') {
          return 'Clear the selection'
        }
        return result && result.courtName
      }
    }
  })
})
