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
    defaultValue: document.getElementById('autocomplete-script').dataset.nextHearingCourtName,
    selectElement: document.querySelector('#next-hearing-court-name'),
    menuClasses: 'govuk-body',
    confirmOnBlur: false,
    name: 'nextHearingCourtName',
    menuClasses: 'govuk-body',
    onConfirm: function (confirmed) {
      if (confirmed && confirmed.courtId) {
        document.getElementById('court-code').value = confirmed.courtId
      }
    },
    templates: {
      inputValue: function (result) {
        return (result && result.courtDescription) ?? ''
      },
      suggestion: function (result) {
        if (result.unableToLoad) {
          return 'No results found'
        }
        if (typeof result === 'string') {
          return 'Clear the selection'
        }
        return result && result.courtDescription
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
