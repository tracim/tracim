import i18n from './i18n.js'
import {
  PAGE,
  getDocumentFromHTMLString
} from './helper.js'
import { getContent } from './action.async.js'

export const MENTION_CONSTANT = {
  TYPE: {
    USER: 1,
    ROLE: 2
  }
}

export const MENTION_ID_PREFIX = 'mention-'
export const MENTION_CLASS = 'mention'
export const MENTION_ME_CLASS = 'mention-me'
export const MENTION_TAG_NAME = 'span'
export const MENTION_REGEX = /@([a-zA-Z0-9\-_]+)(?=\s|$)/
export const MENTION_REGEX_GLOBAL = /@([a-zA-Z0-9\-_]+)(?=\s|$)/g
export const GROUP_MENTION_LIST = [
  {
    mention: 'all',
    detail: 'Sends a notification to all members of the space',
    tradKey: [i18n.t('all'), i18n.t('Sends a notification to all members of the space')],
    isCommon: true
  }
]
export const LINK_REGEX = /#([0-9]+)(?=\s|$)/
export const LINK_TAG_NAME = 'a'
export const LINK_CLASS = 'internal_link primaryColorFont'

const GROUP_MENTION_TRANSLATION_LIST = ['all', 'tous', 'todos', 'alle', 'الكل']

const isAWrappedMention = (node) => (
  node.nodeName.toLowerCase() === MENTION_TAG_NAME &&
  node.id &&
  node.id.startsWith(MENTION_ID_PREFIX)
)

export const getInvalidMentionList = (content, knownMembersMentions) => {
  const doc = getDocumentFromHTMLString(content)
  const foundMentions = doc.body.textContent.match(MENTION_REGEX_GLOBAL) || []
  const possibleMentions = [...knownMembersMentions, ...GROUP_MENTION_TRANSLATION_LIST.map(mention => `@${mention}`)]
  return [...new Set(foundMentions.filter(
    mention => !possibleMentions.includes(mention)
  ))]
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

export const getMatchingGroupMentionList = (query) => {
  const matching = []
  for (const mention of GROUP_MENTION_LIST) {
    const translatedMention = { ...mention, mention: i18n.t(mention.tradKey[0]) }
    if (translatedMention.mention.indexOf(query.toLowerCase()) >= 0) matching.push(translatedMention)
  }
  return matching
}

// /////////////////////////////////////////////////////////////////////////////
// NOTE - MP - 2022-12-02 - MENTION SECTION
// /////////////////////////////////////////////////////////////////////////////

// NOTE - MP - 2023-01-11 - This should be merged with ROLE_LIST. However, since we only support
// `all` role, it requires some additional processing.
export const DEFAULT_ROLE_LIST = [
  {
    description: 'Every members of the space',
    id: 0,
    label: 'All',
    slug: 'all',
    tradKey: [i18n.t('Every members of the space'), i18n.t('All'), i18n.t('all')]
  }
]

/**
 * Search mention in a string
 * @param {String} text The text to search mentions in
 * @returns {List[String]} List of mentions found
 * Example:
 * - Input: `<p>Test @John</p>`
 * - Output: `['@John']`
 */
export const searchMention = (text) => {
  // Regex explanation: https://regex101.com/r/hHosBa/11
  // Match (@XXX part): '@XXX', ' @XXX ', '@XXX-', ':@XXX:', '(@XXX)', '!@XXX!', ...
  // Don't match: 'XXX@XXX', '@<span>XXX</span>'
  const mentionRegex = /(?:^|\s|\W)@([a-zA-Z0-9_-]+)\b/g
  const mentionList = text.match(mentionRegex)
  return mentionList || []
}

/**
 * Replace not formatted mention with html mention element
 * @param {List[role]} roleList List of role that can be mentioned
 * @param {List[user]} userList List of user that can be mentioned
 * @param {String} html Current content of the editor
 * @returns {{html: String, invalidMentionList: List[String]}} Correctly formatted html content
 * Example:
 * - Input: `<p>Test @John</p>`
 * - Output:
 * {
 *   html: `<p>Test <html-mention userid="151"/></p>`;
 *   invalidMentionList: [];
 * }
 */
export const searchMentionAndReplaceWithTag = (roleList, userList, html) => {
  const mentionList = searchMention(html)
  const invalidMentionList = []

  let newHtml = html

  mentionList.forEach(mention => {
    const mentionWithoutAt = mention.slice(2)
    const role = roleList.find(r => i18n.t(r.slug) === mentionWithoutAt)
    const user = userList.find(u => u.username === mentionWithoutAt)
    if (role || user) {
      const labelId = role ? 'roleid' : 'userid'
      const valueId = role ? role.id : user.id
      const mentionBalise = `<html-mention ${labelId}="${valueId}"></html-mention>`
      const mentionText = role ? i18n.t(role.slug) : user.username
      // Regex explanation: https://regex101.com/r/hHosBa/11
      // Match (@XXX part): '@XXX', ' @XXX ', '@XXX-', ':@XXX:', '(@XXX)', '!@XXX!', ...
      // Don't match: 'XXX@XXX', '@<span>XXX</span>'
      // ${mentionText} will be replaced with role or user variable
      const mentionRegex = new RegExp(`(?:^|\\s|\\W)@${mentionText}\\b`, 'g')
      // NOTE - MP - 2023-04-11 - We use mention[0] because the regex lookahead is included in the
      // match
      newHtml = newHtml.replace(mentionRegex, `${mention[0]}${mentionBalise}`)
    } else {
      invalidMentionList.push(mention)
    }
  })

  return { html: newHtml, invalidMentionList }
}

/**
 * Replace the given HTML string containing the mention with the role slug
 * @param {Array[object]} roleList List of roles
 * @param {String} html Current html text with balise mention
 * @returns Html text without mention balise
 * Example:
 * - Input: `<p>Test <html-mention roleid="0"><\html-mention></p>`
 * - Output: `<p>Test @all</p>`
 */
const replaceHTMLElementWithMentionRole = (roleList, html) => {
  const mentionRegex = /<html-mention roleid="(\d+)"><\/html-mention>/g
  const mentionTagList = html.match(mentionRegex)
  if (!mentionTagList) return html

  let newHtml = html

  mentionTagList.forEach(mentionTag => {
    const mentionTagData = mentionTag.match(/roleid="(\d+)"/)
    const roleId = Number(mentionTagData[1])

    const role = roleList.find(r => r.id === roleId)
    let mention = ''
    if (!role) {
      console.warn(
        `helper.js - replaceHTMLElementWithMentionRole - Role from id ${roleId} not found`
      )
      mention = `@${i18n.t('UnknownRole')}`
    } else {
      mention = `@${i18n.t(role.slug)}`
    }
    newHtml = newHtml.replace(mentionTag, mention)
  })

  return newHtml
}

/**
 * Replace the given HTML string containing the mention with the role slug
 * @param {Array[object]} userList List of users
 * @param {String} html Current html text with balise mention
 * @returns Html text without mention balise
 * Example:
 * - Input: `<p>Test <html-mention userid="151"><\html-mention></p>`
 * - Output: `<p>Test @John</p>`
 */
const replaceHTMLElementWithMentionUser = (userList, html) => {
  const mentionRegex = /<html-mention userid="(\d+)"><\/html-mention>/g
  const mentionTagList = html.match(mentionRegex)
  if (!mentionTagList) return html

  let newHtml = html

  mentionTagList.forEach(mentionTag => {
    const mentionTagData = mentionTag.match(/userid="(\d+)"/)
    const userId = Number(mentionTagData[1])

    const user = userList.find(u => u.id === userId)
    let mention = ''
    if (!user) {
      console.warn(
        `helper.js - replaceHTMLElementWithMentionUser - User from id ${userId} not found`
      )
      mention = '@UnknownUser'
    } else {
      mention = `@${user.username}`
    }
    newHtml = newHtml.replace(mentionTag, mention)
  })

  return newHtml
}

/**
 * Replace html mention element with mention
 * @param {List[role]} roleList List of role that can be mentioned
 * @param {List[user]} userList List of user that can be mentioned
 * @param {String} html Current content of the editor
 * Example:
 * - Input: `<p>Test <html-mention userid="151"/><html-mention></p>`
 * - Output: `<p>Test @John</p>`
 */
export const replaceHTMLElementWithMention = (roleList, userList, html) => {
  let newHtml = replaceHTMLElementWithMentionRole(roleList, html)
  newHtml = replaceHTMLElementWithMentionUser(userList, newHtml)
  return newHtml
}

// /////////////////////////////////////////////////////////////////////////////
// NOTE - MP - 2022-12-09 - LINK SECTION
// /////////////////////////////////////////////////////////////////////////////

/**
 * Search content in a string
 * @param {String} text The text to search mentions in
 * @returns {List[String]} List of content id found
 * Example:
 * - Input: `<p>Test #844</p>`
 * - Output: `['#844']`
 */
const searchContent = (text) => {
  // Regex explanation: https://regex101.com/r/z1WUUu/4
  // Match (#XXX part): '#XXX', '#XXX ', ' #XXX', '#XXX:', ':#XXX', '(#XXX)', '#XXX!', ...
  // Don't match: 'XXX#XXX', '#<span>XXX</span>', '#XXX'
  const contentRegex = /(?!")(?:^|\s|\W)#([0-9]+)\b/g
  const contentList = text.match(contentRegex)
  return contentList || []
}

// TODO - MP - 2022-12-09 - Replace hard written balise by a custom element (just like mention)
// See [#6083](https://github.com/tracim/tracim/issues/6083)
/**
 * Replace not formatted content with formatted content html
 * @param {String} apiUrl Url of the api to get the content
 * @param {String} html Current content of the editor
 * @returns {{html: String, invalidContentList: List[String]}} Correctly formatted html content
 * Example:
 * - Input: `<p>Test #844</p>`
 * - Output:
 * {
 *   html: `<p>Test <a class="internal_link primaryColorFont" href="/ui/contents/762" title="#844">
 * John content</a>`;
 *   invalidContentList: [];
 * }
 */
export const searchContentAndReplaceWithTag = async (apiUrl, html) => {
  const contentList = searchContent(html)
  const invalidContentList = []

  let newHtml = html

  await Promise.all(contentList.map(async content => {
    const contentId = content.slice(2)
    const fetchContent = await getContent(apiUrl, contentId)

    if (fetchContent.status === 200) {
      const contentTitle = (await fetchContent.json()).label
      const linkBalise = `<a class="internal_link primaryColorFont" href="${
        PAGE.CONTENT(contentId)
      }" title="${content.slice(1)}">${contentTitle}</a>`
      // Regex explanation: https://regex101.com/r/z1WUUu/4
      // Match (#XXX part): '#XXX', '#XXX ', ' #XXX', '#XXX:', ':#XXX', '(#XXX)', '#XXX!', ...
      // Don't match: 'XXX#XXX', '#<span>XXX</span>', '"#XXX'
      // ${contentId} will be replaced with contentId
      const contentRegex = new RegExp(`(?!")(?:^|\\s|\\W)#${contentId}\\b`, 'g')
      // NOTE - MP - 2023-04-11 - We use content[0] because the regex lookahead is included in the
      // match
      newHtml = newHtml.replace(contentRegex, `${content[0]}${linkBalise}`)
    } else {
      invalidContentList.push(content)
    }
  }))

  return { html: newHtml, invalidContentList }
}
