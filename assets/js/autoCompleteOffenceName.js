(function () {
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

  function offenceValue(offence) {
    return offence.code + ' ' + offence.description
  }

  const request = new XMLHttpRequest()

  window.addEventListener('load', function () {
    const select = document.querySelector('#offence-name')
    const autocompleteScript = document.getElementById('autocomplete-script')
    const defaultOffence = autocompleteScript ? autocompleteScript.dataset.offence : ''

    if (select) {

      accessibleAutocomplete({
        element: select.parentElement,
        id: 'offence-name',
        name: 'offenceName',
        defaultValue: defaultOffence,
        confirmOnBlur: false,
        minLength: 2,
        displayMenu: 'overlay',
        inputClasses: 'govuk-input',
        menuClasses: 'govuk-body',

        source: debounce(function (query, populateResults) {
          request.open('GET', '/api/search-offence?searchString=' + encodeURIComponent(query), true)
          request.timeout = 2000
          request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
              if (request.status === 200) {
                try {
                  const json = JSON.parse(request.responseText)
                  populateResults(json)
                } catch (e) {
                  populateResults([])
                }
              } else {
                populateResults([{ unableToLoad: true }])
              }
            }
          }
          request.send()
        }, 100),

        templates: {
          inputValue: function (result) {
            if (!result || typeof result === 'string') {
              return ''
            }
            return offenceValue(result)
          },
          suggestion: function (result) {
            if (result && result.unableToLoad) {
              return 'No results found'
            }
            if (typeof result === 'string') {
              return 'Clear the selection'
            }
            return result && offenceValue(result)
          }
        }
      })
    }
  })
})()
