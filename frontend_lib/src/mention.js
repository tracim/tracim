import { v4 as uuidv4 } from 'uuid'
import i18n from './i18n.js'

export const MENTION_ID_PREFIX = 'mention-'
export const MENTION_CLASS = 'mention'
export const MENTION_ME_CLASS = 'mention-me'
export const MENTION_TAG_NAME = 'span'
export const MENTION_REGEX = /(^|\s)@([a-zA-Z0-9\-_]+)($|\s)/
export const GROUP_MENTION_LIST = [
  {
    mention: 'all',
    detail: 'Sends a notification to all members of the space',
    tradKey: [i18n.t('Sends a notification to all members of the space')],
    isCommon: true
  }
]

export const GROUP_MENTION_TRANSLATION_LIST = ['all', 'tous', 'todos']

const depthFirstSearchAndMentionAnalysis = childNodesList => {
  const childNodesListCopy = [...childNodesList]
  let i = 0

  childNodesListCopy.forEach((node) => {
    const value = node.nodeValue

    if (node.nodeName === '#text' && value.includes('@')) {
      const mentionsInThisNode = value.split(/\s/).filter(token => MENTION_REGEX.test(token))

      if (mentionsInThisNode.length > 0) {
        let mentionIndex = 0
        let lastMentionIndex = 0
        const fragment = document.createDocumentFragment()
        let htmlTagCounter = 0

        mentionsInThisNode.forEach((mention, i) => {
          mentionIndex = value.indexOf(mention, lastMentionIndex)

          const mentionWithSpan = document.createElement(MENTION_TAG_NAME)
          mentionWithSpan.className = MENTION_CLASS
          mentionWithSpan.id = `${MENTION_ID_PREFIX}${uuidv4()}`
          mentionWithSpan.textContent = mention

          if (mentionIndex !== 0) {
            htmlTagCounter++
            fragment.appendChild(document.createTextNode(value.substring(lastMentionIndex, mentionIndex)))
          }

          fragment.appendChild(mentionWithSpan)
          htmlTagCounter++

          if (mentionsInThisNode.length - 1 === i) {
            htmlTagCounter++
            fragment.appendChild(document.createTextNode(value.substring(mentionIndex + mention.length)))
          }

          lastMentionIndex = mentionIndex + mention.length - 1
        })
        childNodesList[i].replaceWith(fragment)
        i = i + htmlTagCounter
      } else i++
    } else {
      if (!(node.nodeName.toLowerCase() === MENTION_TAG_NAME && node.id.startsWith(MENTION_ID_PREFIX))) depthFirstSearchAndMentionAnalysis(node.childNodes)
      i++
    }
  })
}

// Call the given callback for each mention found in the given content.
// Mention detection assumes that the mentions have been wrapped using wrapMentionsInSpanTags().
// callback with get the matching DOM Element as parameter.
// document is a DOM Document
const forEachMentionIn = (callback, document, mentions) => {
  const elementHasMentionForUser = element => {
    if (element.id === null || !element.id.startsWith(MENTION_ID_PREFIX)) return false
    for (const mention of mentions) {
      if (element.textContent.includes('@' + mention)) return true

    }
    return false
  }

  const spans = document.getElementsByTagName(MENTION_TAG_NAME)
  for (const element of spans) {
    if (elementHasMentionForUser(element)) callback(element)
  }
}

export const addClassToMentionsOfUser = (rawContent, username, userClassName = MENTION_ME_CLASS) => {
  const addUserClass = element => element.classList.add(userClassName)

  const parser = new DOMParser()
  const document = parser.parseFromString(rawContent, 'text/html')
  if (document.documentElement.tagName === 'parsererror') {
    throw new Error('Cannot parse string: ' + document.documentElement)
  }
  forEachMentionIn(addUserClass, document, [username, ...GROUP_MENTION_TRANSLATION_LIST])
  return document.body.innerHTML
}

export const removeClassFromMentionsOfUser = (document, username, userClassName = MENTION_ME_CLASS) => {
  const removeUserClass = element => {
    element.classList.remove(userClassName)
    if (!element.classList.length) element.removeAttribute('class')
  }
  forEachMentionIn(removeUserClass, document, [username, ...GROUP_MENTION_TRANSLATION_LIST])
}

export const wrapMentionsInSpanTags = (document) => {
  depthFirstSearchAndMentionAnalysis(document.body.childNodes)
}

export const handleMentionsBeforeSave = (text, loggedUsername) => {
  const parser = new DOMParser()
  try {
    const document = parser.parseFromString(text, 'text/html')
    if (document.documentElement.tagName === 'parsererror') {
      throw new Error('Cannot parse string: ' + document.documentElement.textContent)
    }
    wrapMentionsInSpanTags(document)
    removeClassFromMentionsOfUser(document, loggedUsername)
    return document.body.innerHTML
  } catch (e) {
    console.error('Error while parsing mention', e)
    throw new Error(i18n.t('Error while detecting the mentions'))
  }
}

export const getMatchingGroupMentionList = (query) => {
  const matching = []
  for (const mention of GROUP_MENTION_LIST) {
    const translatedMention = { ...mention, mention: i18n.t(mention.mention) }
    if (translatedMention.mention.indexOf(query.toLowerCase()) >= 0) matching.push(translatedMention)
  }
  return matching
}
