import { v4 as uuidv4 } from 'uuid'
import i18n from './i18n.js'

export const MENTION_ID_PREFIX = 'mention-'
export const MENTION_CLASS = 'mention'
export const MENTION_ME_CLASS = 'mention-me'
export const MENTION_TAG_NAME = 'span'
export const MENTION_REGEX = /@([a-zA-Z0-9\-_]+)(?=\s|$)/
export const GROUP_MENTION_LIST = [
  {
    mention: 'all',
    detail: 'Sends a notification to all members of the shared space',
    tradKey: [i18n.t('Sends a notification to all members of the shared space')],
    isCommon: true
  }
]

export const GROUP_MENTION_TRANSLATION_LIST = ['all', 'tous', 'todos']

const wrapMentionsFromText = (text, doc) => {
  // takes a text as string, and returns a document fragment
  // containing this text, with tags added for the mentions
  const match = text.match(MENTION_REGEX)
  if (!match || (match.index > 0 && (text[match.index - 1].trim()))) {
    return doc.createTextNode(text)
  }

  const fragment = doc.createDocumentFragment()

  fragment.appendChild(doc.createTextNode(text.substring(0, match.index)))

  const wrappedMention = doc.createElement(MENTION_TAG_NAME)
  wrappedMention.className = MENTION_CLASS
  wrappedMention.id = `${MENTION_ID_PREFIX}${uuidv4()}`
  wrappedMention.textContent = match[0]
  fragment.appendChild(wrappedMention)

  const mentionEndIndex = match.index + match[0].length
  fragment.appendChild(wrapMentionsFromText(text.substring(mentionEndIndex), doc))

  return fragment
}

const isAWrappedMention = (node) => (
  node.nodeName.toLowerCase() === MENTION_TAG_NAME &&
  node.id &&
  node.id.startsWith(MENTION_ID_PREFIX)
)

export const wrapMentionsInSpanTags = (node, doc) => {
  // takes a DOM node, and returns a copy with mention
  // wrapped in tags MENTION_TAG_NAME, with class MENTION_CLASS
  // and mention-xxx IDs

  if (isAWrappedMention(node)) {
    const mention = node.cloneNode(true)
    mention.classList.add(MENTION_CLASS)
    return mention
  }

  const resultingNode = node.cloneNode(false)

  for (const child of node.childNodes) {
    resultingNode.appendChild(
      (child.nodeName === '#text')
        ? wrapMentionsFromText(child.textContent, doc)
        : wrapMentionsInSpanTags(child, doc)
    )
  }

  return resultingNode
}

const getDocumentFromHTMLString = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html')

  if (doc.documentElement.tagName === 'parsererror') {
    throw new Error('Cannot parse string: ' + doc.documentElement.textContent)
  }

  return doc
}

const getMentions = function * (node) {
  for (const candidate of node.querySelectorAll(MENTION_TAG_NAME)) {
    if (isAWrappedMention(candidate)) {
      yield candidate
    }
  }
}

export const addClassToMentionsOfUser = (rawContent, username, userClassName = MENTION_ME_CLASS) => {
  const body = getDocumentFromHTMLString(rawContent).body

  const relevantMentions = [username, ...GROUP_MENTION_TRANSLATION_LIST]
  for (const wrappedMention of getMentions(body)) {
    if (relevantMentions.some(mention => wrappedMention.textContent.trim() === '@' + mention)) {
      wrappedMention.classList.add(userClassName)
    }
  }

  return body.innerHTML
}

export const removeMentionMeClass = (body) => {
  for (const mention of getMentions(body)) {
    mention.classList.remove(MENTION_ME_CLASS)
    if (!mention.classList.length) {
      mention.removeAttribute('class')
    }
  }
}

export const handleMentionsBeforeSave = (htmlString, loggedUsername) => {
  try {
    const doc = getDocumentFromHTMLString(htmlString)
    const bodyWithWrappedMentions = wrapMentionsInSpanTags(doc.body, doc)
    removeMentionMeClass(bodyWithWrappedMentions, loggedUsername)
    return bodyWithWrappedMentions.innerHTML
  } catch (e) {
    console.error('Error while parsing mentions', e)
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
