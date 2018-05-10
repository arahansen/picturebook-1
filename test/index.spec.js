const { storyFolders } = require('../shared/storyFolders')
const { flattenDeep } = require('lodash')
const { skip } = require('../params')

const targetUrlIndex = process.argv.indexOf('--url')

const BASE_URL = process.argv[targetUrlIndex + 1]

function getStories(content) {
  if (content.namepath) {
    return content
  }
  return Object.values(content).map(getStories)
}

function isPartialMatch(reference, partial) {
  return reference.toLowerCase().includes(partial.toLowerCase())
}

function partialSkipMatch(props) {
  const { name, folderpath } = props

  return !(skip || []).some(
    match => isPartialMatch(name, match) || isPartialMatch(folderpath, match)
  )
}

function formatProperties(props) {
  const { folderpath, name, image, mobile } = props

  return {
    label: `${folderpath}__${name}`,
    image,
    mobile,
    url: `${BASE_URL}?selectedKind=${encodeURIComponent(
      folderpath
    )}&selectedStory=${encodeURIComponent(name)}`,
  }
}

const scenarios = Object.keys(storyFolders)
  .map(kind => ({
    kind,
    storyNames: flattenDeep(getStories(storyFolders[kind])),
  }))
  .reduce(
    (prev, story) => prev.concat(story.storyNames.filter(partialSkipMatch).map(formatProperties)),
    []
  )

/* eslint-disable no-undef, func-names, prefer-arrow-callback */
scenarios.forEach(page => {
  gemini.suite(page.label, suite => {
    suite
      .setUrl(page.url)
      .before(function(actions) {
        actions.executeJS(function(window) {
          const body = window.document.querySelector('body')
          body.style.overflow = 'hidden'
          body.style.height = '100vh'
          body.style.width = '100vw'
        })
      })
      .setCaptureElements('body')
      .capture('baseline')
  })
})
/* eslint-enable no-undef, func-names, prefer-arrow-callback */
