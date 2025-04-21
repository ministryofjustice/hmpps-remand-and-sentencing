function debounce(fn, delay) {
  var timer = null
  return function () {
    var context = this,
      args = arguments
    clearTimeout(timer)
    timer = setTimeout(function () {
      fn.apply(context, args)
    }, delay)
  }
}

const request = new XMLHttpRequest()

window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    defaultValue: document.getElementById('autocomplete-script').dataset.court,
    selectElement: document.querySelector('#court-name'),
    confirmOnBlur: false,
    name: 'courtName',
    menuClasses: 'govuk-body',
    onConfirm: function (confirmed) {
      if (confirmed && confirmed.courtId) {
        document.getElementById('court-code').value = confirmed.courtId
      } else {
        document.getElementById('court-code').value = ''
      }
    },
    templates: {
      inputValue: function (result) {
        return (result && result.courtName) ?? ''
      },
      suggestion: function (result) {
        if (result.unableToLoad) {
          return 'No results found'
        }
        if (typeof result === 'string') {
          return 'Clear the selection'
        }
        return result && result.courtName
      },
    },
    minLength: 3,
    source: debounce(function (query, populateResults) {
      request.open('GET', '/api/search-court?searchString=' + query, true)
      // Time to wait before giving up fetching the search index
      request.timeout = 2 * 1000
      request.onreadystatechange = function () {
        // XHR client readyState DONE
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            var response = request.responseText
            var json = JSON.parse(response)
            populateResults(json)
          } else {
            populateResults([{ unableToLoad: true }])
          }
        }
      }
      request.send()
    }, 100),
  })
})
