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

function govukFont(text) {
  return '<span class="govuk-body">' + text + '</span>'
}

function caseOutcomeValue(caseOutcome) {
  return caseOutcome.description
}

const request = new XMLHttpRequest()
const warrantType = document.getElementById('autocomplete-script').getAttribute('data-warrant-type')
window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    defaultValue: '',
    selectElement: document.querySelector('#case-outcome'),
    confirmOnBlur: false,
    name: 'caseOutcome',
    templates: {
      inputValue: function (result) {
        return (result && caseOutcomeValue(result)) ?? ''
      },
      suggestion: function (result) {
        if (result.unableToLoad) {
          return govukFont('No results found')
        }
        if (typeof result === 'string') {
          return govukFont('Clear the selection')
        }
        return result && govukFont(caseOutcomeValue(result))
      },
    },
    minLength: 2,
    source: debounce(function (query, populateResults) {
      request.open('GET', '/api/search-case-outcome?type=' + warrantType + '&searchString=' + query, true)
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
