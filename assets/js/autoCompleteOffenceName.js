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

function offenceValue(offence) {
  return offence.code + '_' + offence.description
}

const request = new XMLHttpRequest()

window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    defaultValue: '',
    selectElement: document.querySelector('#offence-name'),
    confirmOnBlur: false,
    templates: {
      inputValue: function (result) {
        return (result && offenceValue(result)) ?? ''
      },
      suggestion: function (result) {
        if (result.unableToLoad) {
          return govukFont('No results found')
        }
        if (typeof result === 'string') {
          return govukFont('Clear the selection')
        }
        return result && govukFont(result.code + ' ' + result.description)
      },
    },
    minLength: 2,
    source: debounce(function (query, populateResults) {
      request.open('GET', '/api/search-offence?searchString=' + query, true)
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
