import { v4 as uuidv4 } from 'uuid'
import React from 'react'
import i18n from './i18n.js'
import { format, formatDistance } from 'date-fns'
import color from 'color'

import ErrorFlashMessageTemplateHtml from './component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'
import { CUSTOM_EVENT } from './customEvent.js'
import {
  getContentPath,
  getReservedUsernames,
  getUsernameAvailability
} from './action.async.js'

import {
  ALLOWED_CHARACTERS_USERNAME,
  APP_FEATURE_MODE,
  BREADCRUMBS_TYPE,
  CONTENT_TYPE,
  DATE_FNS_LOCALE,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  PAGE,
  TIMELINE_TYPE,
  USERNAME_ALLOWED_CHARACTERS_REGEX
} from './constant.js'

import {
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from './tracimLiveMessage.js'

import { MENTION_CONSTANT } from './mentionOrLinkOrSanitize.js'

export const generateFetchResponse = async fetchResult => {
  const resultJson = await fetchResult.clone().json()
  return new Promise((resolve, reject) => resolve({
    apiResponse: fetchResult,
    body: resultJson,
    ok: fetchResult.ok
  }))
}

export const errorFlashMessageTemplateObject = errorMsg => ({
  type: CUSTOM_EVENT.ADD_FLASH_MSG,
  data: {
    msg: <ErrorFlashMessageTemplateHtml errorMsg={errorMsg} />,
    type: 'danger',
    delay: 30000
  }
})

export const handleFetchResult = async fetchResult => {
  const status = fetchResult.status

  if (status === 204) return fetchResult // no result
  if (status >= 200 && status <= 299) return generateFetchResponse(fetchResult)
  if (status >= 300 && status <= 399) return generateFetchResponse(fetchResult)
  if (status === 401) { // unauthorized
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.DISCONNECTED_FROM_API, date: {} })
    return generateFetchResponse(fetchResult)
  }
  if (status >= 400 && status <= 499) return generateFetchResponse(fetchResult) // let specific handler handle it with fetchResult.body.code
  if (status >= 500 && status <= 599) {
    GLOBAL_dispatchEvent(errorFlashMessageTemplateObject(`Unexpected api error with http status ${status}`)) // no need for translation
    return generateFetchResponse(fetchResult)
  }

  GLOBAL_dispatchEvent(errorFlashMessageTemplateObject(`Unknown http status ${status}`)) // no need for translation
  return generateFetchResponse(fetchResult)
}

export const addAllResourceI18n = (i18nFromApp, translation, activeLang) => {
  Object.keys(translation).forEach(lang =>
    Object.keys(translation[lang]).forEach(namespace =>
      i18nFromApp.addResources(lang, namespace, translation[lang][namespace])
    )
  )
  i18n.changeLanguage(activeLang) // set frontend_lib's i18n on app mount
}

export const displayDistanceDate = (dateToDisplay, lang) => {
  if (!dateToDisplay) return ''
  return formatDistance(
    new Date(dateToDisplay),
    new Date(),
    { locale: DATE_FNS_LOCALE[lang], addSuffix: true }
  )
}

export const updateTLMUser = (user, isAdmin) => {
  return user
    ? { ...user, is_from_system_admin: false }
    : {
      allowed_space: 0,
      auth_type: 'internal',
      avatar_url: null,
      created: '',
      email: '',
      is_active: true,
      is_deleted: false,
      is_from_system_admin: true,
      lang: 'en',
      profile: 'administrators',
      public_name: isAdmin ? i18n.t('System Administrator') : i18n.t('Unknown'),
      timezone: '',
      user_id: 0,
      username: ''
    }
}

// INFO - GB - 2019-07-05 - This password generator function was based on
// https://stackoverflow.com/questions/5840577/jquery-or-javascript-password-generator-with-at-least-a-capital-and-a-number
export const generateRandomPassword = () => {
  const password = []
  const charCode = String.fromCharCode
  const randomNumber = Math.random
  let random, i

  for (i = 0; i < 10; i++) { // password with a size 10
    random = 0 | randomNumber() * 62 // generate upper OR lower OR number
    password.push(charCode(48 + random + (random > 9 ? 7 : 0) + (random > 35 ? 6 : 0)))
  }
  const randomPassword = password.sort(() => { return randomNumber() - 0.5 }).join('')

  return randomPassword
}

export const getOrCreateSessionClientToken = () => {
  const clientTokenKey = 'tracimClientToken'
  let token = window.sessionStorage.getItem(clientTokenKey)
  if (token === null) {
    token = uuidv4()
    window.sessionStorage.setItem(clientTokenKey, token)
  }
  return token
}

export const COMMON_REQUEST_HEADERS = {
  Accept: 'application/json',
  'X-Tracim-ClientToken': getOrCreateSessionClientToken()
}

export const FETCH_CONFIG = {
  headers: {
    ...COMMON_REQUEST_HEADERS,
    'Content-Type': 'application/json'
  }
}

export const setupCommonRequestHeaders = (xhr) => {
  for (const [key, value] of Object.entries(COMMON_REQUEST_HEADERS)) {
    xhr.setRequestHeader(key, value)
  }
}

export const displayFileSize = (bytes, decimals) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals <= 0 ? 0 : decimals || 2
  const sizes = [
    i18n.t('Bytes'),
    i18n.t('KB'),
    i18n.t('MB'),
    i18n.t('GB'),
    i18n.t('TB'),
    i18n.t('PB'),
    i18n.t('EB'),
    i18n.t('ZB'),
    i18n.t('YB')
  ]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const parserStringToList = (string, separatorList = [',', ';', '\n']) => {
  let parsedString = string

  separatorList.forEach(separator => {
    parsedString = parsedString.split(separator).join(',')
  })

  return parsedString.split(',').map(str => str.trim()).filter(notEmptyString => notEmptyString !== '')
}

// INFO - GB - 2021-09-16 - This function checks if the string looks like an email (username@domain)
// with a non empty username and a non-empty domain and without <, >, new line, comma or semicolon
// Warning: These rules are the same in frontend and should be keep synchronised. If you change the rules
// here, you shoul adapt the class TracimEmailValidator in tracim/backend/tracim_backend/app_models/email_validators.py
export const checkEmailValidity = email => {
  if (email.includes('<') && email.includes('>')) email = email.substring(email.indexOf('<') + 1, email.lastIndexOf('>'))
  const firstPart = email.substr(0, email.lastIndexOf('@'))
  const secondPart = email.substr(email.lastIndexOf('@') + 1)
  return firstPart !== '' && secondPart !== '' && !/[,;<>\n]/.test(email)
}

export const buildFilePreviewUrl = (apiUrl, workspaceId, contentId, revisionId, filenameNoExtension, page, width, height) => {
  const rev = revisionId ? `/revisions/${revisionId}` : ''
  return `${apiUrl}/workspaces/${workspaceId}/files/${contentId}${rev}/preview/jpg/${width}x${height}/${encodeURIComponent(filenameNoExtension) + '.jpg'}?page=${page}`
}

export const splitFilenameExtension = filename => {
  const match = filename.match(/^([\s\S]*?)((?:\.tar)?(?:\.[^.]+))$/)
  return {
    basename: match ? match[1] : filename,
    extension: match ? match[2] : ''
  }
}

export const removeExtensionOfFilename = filename => splitFilenameExtension(filename).basename

export const computeProgressionPercentage = (progressionLoaded, progressionTotal, elementListLength = 1) => (progressionLoaded / progressionTotal * 99) / elementListLength

export const buildHeadTitle = words => words.reduce((acc, curr) => acc !== '' ? `${acc} · ${curr}` : curr, '')

export const buildTracimLiveMessageEventType = (entityType, coreEntityType, optionalSubType = null) => `${entityType}.${coreEntityType}${optionalSubType ? `.${optionalSubType}` : ''}`

export const addRevisionFromTLM = (data, timeline, lang, isTokenClient = true) => {
  if (timeline.find(item => item.revision_id === data.content.current_revision_id)) return timeline
  // INFO - GB - 2020-05-29 In the filter below we use the names from the TLM message so they are not in camelCase and it is necessary to ignore the eslint rule.
  const {
    actives_shares, // eslint-disable-line camelcase
    author,
    created,
    current_revision_id, // eslint-disable-line camelcase
    current_revision_type, // eslint-disable-line camelcase
    last_modifier, // eslint-disable-line camelcase
    ...revisionObject
  } = data.content

  return [
    ...timeline,
    {
      ...revisionObject,
      author: {
        public_name: data.author.public_name,
        avatar_url: data.author.avatar_url,
        user_id: data.author.user_id
      },
      created: displayDistanceDate(data.content.modified, lang),
      created_raw: data.content.modified,
      revision_id: data.content.current_revision_id,
      revision_type: data.content.current_revision_type,
      timelineType: TIMELINE_TYPE.REVISION
    }
  ]
}

export const removeAtInUsername = (username) => {
  let trimmedUsername = username.trim()
  if (trimmedUsername.length > 0 && trimmedUsername[0] === '@') {
    trimmedUsername = trimmedUsername.substring(1)
  }
  return trimmedUsername
}

export const hasSpaces = name => /\s/.test(name)

// FIXME - GM - 2020-06-24 - This function doesn't handle nested object, it need to be improved
// https://github.com/tracim/tracim/issues/3229
export const serialize = (objectToSerialize, propertyMap) => {
  return Object.fromEntries(
    Object.entries(objectToSerialize)
      .map(([key, value]) => [propertyMap[key], value])
      .filter(([key, value]) => key !== undefined)
  )
}

export const getCurrentContentVersionNumber = (appFeatureMode, content, timeline) => {
  if (appFeatureMode === APP_FEATURE_MODE.REVISION) return content.number
  return timeline.filter(t => t.timelineType === 'revision').length
}

// Check that the given username is valid.
// Return an object:
// {isUsernameValid: false, usernameInvalidMsg: 'Username invalid'}
// The message is translated using the given props.t.
export const checkUsernameValidity = async (apiUrl, username, props) => {
  if (username.length < MINIMUM_CHARACTERS_USERNAME) {
    return {
      isUsernameValid: false,
      usernameInvalidMsg: props.t('Username must be at least {{minimumCharactersUsername}} characters long', { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME })
    }
  }

  if (username.length > MAXIMUM_CHARACTERS_USERNAME) {
    return {
      isUsernameValid: false,
      usernameInvalidMsg: props.t('Username must be at maximum {{maximumCharactersUsername}} characters long', { maximumCharactersUsername: MAXIMUM_CHARACTERS_USERNAME })
    }
  }

  if (hasSpaces(username)) {
    return {
      isUsernameValid: false,
      usernameInvalidMsg: props.t("Username can't contain any whitespace")
    }
  }

  // INFO - GB - 2020-06-08 The allowed characters are azAZ09-_.
  if (!(/^[A-Za-z0-9_.-]*$/.test(username))) {
    return {
      isUsernameValid: false,
      usernameInvalidMsg: props.t('Allowed characters: {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })
    }
  }

  const fetchReservedUsernames = await getReservedUsernames(apiUrl)
  if (fetchReservedUsernames.status !== 200 || !fetchReservedUsernames.json.items) {
    throw new Error(props.t('Error while checking reserved usernames'))
  }
  if (fetchReservedUsernames.json.items.indexOf(username) >= 0) {
    return {
      isUsernameValid: false,
      usernameInvalidMsg: props.t('This word is reserved for group mentions')
    }
  }

  const fetchUsernameAvailability = await getUsernameAvailability(apiUrl, username)
  if (fetchUsernameAvailability.status !== 200) {
    throw new Error(props.t('Error while checking username availability'))
  }
  if (!fetchUsernameAvailability.json.available) {
    return {
      isUsernameValid: false,
      usernameInvalidMsg: props.t('This username is not available')
    }
  }

  return {
    isUsernameValid: true,
    usernameInvalidMsg: ''
  }
}

/**
 * INFO - G.B. - 2022-09-10
 * @param {*} rawDate Date to format
 * @param {*} lang Locale lang
 * @param {*} formatTime To see the different format time: https://date-fns.org/v2.29.2/docs/format
 * @returns
 */
export const formatAbsoluteDate = (rawDate, lang = 'en', formatTime) => {
  if (!rawDate) return
  return format(new Date(rawDate), formatTime || 'Pp', { locale: DATE_FNS_LOCALE[lang] })
}

/**
 * Equality test done as numbers with the following rules:
 * - strings are converted to numbers before comparing
 * - undefined and null are converted to 0 before comparing
 * @param {*} var1 number 1 to test
 * @param {*} var2 number 2 to test
 * @returns
 */
export const permissiveNumberEqual = (var1, var2) => {
  return Number(var1 || 0) === Number(var2 || 0)
}

// INFO - RJ - 2020-10-26 - useful to ensure that the same functions can be used with serialized lists (like for frontend)
// or not (like for frontend_app_workspace)
const getSpaceId = (space) => space.workspace_id || space.id

export const createSpaceTree = spaceList => {
  const spaceListWithChildren = spaceList.map(space => ({ ...space, children: space.children || [] }))
  const spaceById = {}
  const newSpaceList = []
  for (const space of spaceListWithChildren) {
    spaceById[getSpaceId(space)] = space
  }
  for (const space of spaceListWithChildren) {
    const parentId = space.parent_id || space.parentId
    if (parentId && spaceById[parentId]) {
      spaceById[parentId].children.push(space)
    } else {
      newSpaceList.push(space)
    }
  }
  return newSpaceList
}

export const naturalCompare = (itemA, itemB, lang, field) => {
  // 2020-09-04 - RJ - WARNING. Option ignorePunctuation is seducing but makes the sort unstable.
  const locale = lang ? lang.replaceAll('_', '-') : undefined
  return itemA[field].localeCompare(itemB[field], locale, { numeric: true })
}

export const humanAndList = (list) => {
  // INFO - RJ - 2021-17-03
  // This function return a localized string that looks like:
  //  - 'elem1' (one element in list)
  //  - 'elem1 and elem2' (two elements)
  //  - 'elem1, elem2 and elem3' (three elements and more)
  //  - 'elem1, elem2, elem3 and elem4'

  switch (list.length) {
    case 0: return ''
    case 1: return list[0]
    default: {
      const allButLast = list.slice(0, list.length - 1).join(', ')
      const last = list[list.length - 1]
      return `${allButLast} ${i18n.t('and')} ${last}`
    }
  }
}

export const scrollIntoViewIfNeeded = (elementToScrollTo, fixedContainer) => {
  // RJ - 2020-11-05 - INFO
  //
  // This function scrolls to the elementToScrollTo DOM element, if not in view.
  // If the element is visible, nothing will happen.
  //
  // fixedContainer needs to be a DOM element that contains elementToScrollTo
  // and that which position does not change when scrolling to the element.
  // A "scroll view" contained in fixedContainer and containing elementToScrollTo
  // is not required but may be here.
  // elementToScrollTo.scrollIntoView() is used to scoll to the element.
  // inspired of the following non standard method:
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded

  if (elementToScrollTo && fixedContainer) {
    const fixedContainerBCR = fixedContainer.getBoundingClientRect()
    const elementBcr = elementToScrollTo.getBoundingClientRect()

    const notInView = (
      (elementBcr.top < fixedContainerBCR.top) ||
      (elementBcr.bottom >= fixedContainerBCR.bottom)
    )

    if (notInView) {
      elementToScrollTo.scrollIntoView()
    }
  }
}

// INFO - FS - 2024-03-26 - Using to the relative luminance formula : https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
const luminance = (color) => {
  const rgbHex = color.replace('#', '')
  const red = parseInt(rgbHex.substr(0, 2), 16)
  const green = parseInt(rgbHex.substr(2, 2), 16)
  const blue = parseInt(rgbHex.substr(4, 2), 16)
  const rgbDec = [red, green, blue]
  var rgb = rgbDec.map(c => {
    c /= 255
    return c < 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2])
}

// INFO - FS - 2024-03-25 - Use the contrast ratio to determine witch text color use : https://github.com/tracim/tracim/issues/6356
// return true if light text color is better than dark for this background
// INFO - ML - 2024-04-26 - Second argument is an optional object containing
//  `.light` color and `.dark` color. Each property is optional
// INFO - ML - 2024-05-03 - This function will return a boolean set to true
//  if the light color is more contrasted than the dark one
//  this doesn't guarantee that the color will be contrasted, it only
//  guarantees that the given light color is more or less contrasted than the dark one
// USAGE - shouldUseLightTextColor('#aabbcc', { light: '#eeeeee', dark: '#666666' })
export const shouldUseLightTextColor = (backColor, frontColors = {}) => {
  const whiteLuminance = frontColors.light ? luminance(frontColors.light) : 1
  const blackLuminance = frontColors.dark ? luminance(frontColors.dark) : 0
  const contrastBackColorWhite = (whiteLuminance + 0.05) / (luminance(backColor) + 0.05)
  const contrastBackColorBlack = (luminance(backColor) + 0.05) / (blackLuminance + 0.05)
  return contrastBackColorBlack < contrastBackColorWhite
}

export const darkenColor = (c) => color(c).darken(0.15).hex()
export const lightenColor = (c) => color(c).lighten(0.15).hex()

export const buildContentPathBreadcrumbs = async (apiUrl, content) => {
  const workspaceId = content.workspace_id || content.workspaceId
  const contentId = content.content_id || content.contentId
  const fetchGetContentPath = await handleFetchResult(await getContentPath(apiUrl, contentId))

  switch (fetchGetContentPath.apiResponse.status) {
    case 200: {
      const contentPathList = fetchGetContentPath.body.items.map(content => content.content_id)
      return fetchGetContentPath.body.items.map(crumb => ({
        link: crumb.content_type === CONTENT_TYPE.FOLDER
          ? PAGE.WORKSPACE.FOLDER_OPEN(workspaceId, contentPathList)
          : PAGE.WORKSPACE.CONTENT(workspaceId, crumb.content_type, crumb.content_id),
        label: crumb.label,
        type: BREADCRUMBS_TYPE.APP_FEATURE,
        isALink: true
      }))
    }
    default:
      console.error('Error getting breadcrumbs data', fetchGetContentPath)
      throw new Error('Error getting breadcrumbs data')
  }
}

// NOTE - MP - 2022-05-31 - Type can be 'info', 'warning' or 'error'
export const sendGlobalFlashMessage = (msg, type = 'warning', delay = undefined) => GLOBAL_dispatchEvent({
  type: CUSTOM_EVENT.ADD_FLASH_MSG,
  data: {
    msg: msg, // INFO - RJ - 2021-03-17 - can be a string or a react element
    type: type,
    delay: delay
  }
})

export const getAvatarBaseUrl = (apiUrl, userId) => `${apiUrl}/users/${userId}/avatar`

export const getCoverBaseUrl = (apiUrl, userId) => `${apiUrl}/users/${userId}/cover`

export const getFileDownloadUrl = (apiUrl, workspaceId, contentId, filename) => `${apiUrl}/workspaces/${workspaceId}/files/${contentId}/raw/${filename}?force_download=1`

export const htmlToText = (domParser, htmlString) => domParser.parseFromString(htmlString, 'text/html').documentElement.textContent

export const addExternalLinksIcons = (htmlString) => {
  const doc = getDocumentFromHTMLString(htmlString)
  const locationUrl = new URL(window.location.toString())
  for (const link of doc.getElementsByTagName('a')) {
    if (!link.hasAttribute('href')) continue
    let url
    try {
      url = new URL(link.href)
    } catch (e) {
      console.error('Error in URL constructor', e)
      continue
    }

    if (url.origin !== locationUrl.origin) {
      const icon = doc.createElement('i')
      icon.className = 'fas fa-external-link-alt'
      icon.style = 'margin-inline-start: 5px;'
      link.appendChild(icon)
    }
  }
  return doc.body.innerHTML
}

export const getDocumentFromHTMLString = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html')

  if (doc.documentElement.tagName === 'parsererror') {
    throw new Error('Cannot parse string: ' + doc.documentElement.textContent)
  }

  return doc
}

const seekUsernameEnd = (text, offset) => {
  while (offset < text.length && USERNAME_ALLOWED_CHARACTERS_REGEX.test(text[offset])) {
    offset++
  }

  return offset
}

export const autoCompleteItem = (text, item, cursorPos, endCharacter) => {
  let character, keyword
  let textBegin, textEnd

  if (item.content_id) {
    character = '#'
    keyword = item.content_id
  } else {
    character = '@'
    keyword = item.mention
  }

  const charAtCursor = cursorPos - 1
  const posAt = text.lastIndexOf(character, charAtCursor)

  if (posAt > -1) {
    const end = seekUsernameEnd(text, cursorPos)
    textBegin = text.substring(0, posAt) + character + keyword + endCharacter
    textEnd = text.substring(end)
  } else {
    console.log(`Error in autocompletion: did not find ${character}`)
    textBegin = `${text} ${character}${keyword}${endCharacter}`
    textEnd = ''
  }

  return { textBegin, textEnd }
}

export const handleClickCopyLink = (contentId) => {
  // INFO - G.B. - 2022-08-26 - document.execCommand() is deprecated, but the alternative navigator.clipboard is
  // not compatible with all browsers versions at this time, so a fallback was made to the old algorithm
  const link = `${window.location.origin}${PAGE.CONTENT(contentId)}`
  if (!navigator.clipboard) {
    const tmp = document.createElement('textarea')
    document.body.appendChild(tmp)
    tmp.value = link
    tmp.select()
    document.execCommand('copy')
    document.body.removeChild(tmp)
  } else navigator.clipboard.writeText(link)
}

// INFO - ML - 2022-11-22 - Generates a function testing if 'b' includes 'a', ignoring letter case
// Useful when you have to test if a single string is included in multiple others
// Usage: const fn = stringIncludes('bc'); fn('abcd') -> Outputs: true
export const stringIncludes = (a) => {
  return (b) => {
    if (!a || !b) return false
    return b.toUpperCase().includes(a.toUpperCase())
  }
}

// INFO - ML - 2024-03-01 - This excludes any character that is not of the unicode range of
//  0020 (start of 'Basic Latin') to 1FFF (end of 'Greek Extended') or not of the unicode range of
//  3040 (start of 'Hiragana') to DFFF (end of 'Low Surrogates') which are considered to be common characters
//  /gu trailing indicator is to include unicode characters range
//  Note that this might exclude some other common characters and does not remove ascii symbol characters
//  See more at https://www.ling.upenn.edu/courses/Spring_2003/ling538/UnicodeRanges.html
export const stripEmojis = (str) => {
  if (!str) return ''
  return str.replace(/[^\u{0020}-\u{1FFF}\u{3040}-\u{DFFF}]/gu, '')
}

export const getRevisionTypeLabel = (revisionType, t) => {
  switch (revisionType) {
    case 'revision':
      return t('modified')
    case 'creation':
      return t('created')
    case 'edition':
      return t('modified')
    case 'deletion':
      return t('deleted')
    case 'undeletion':
      return t('undeleted')
    case 'mention':
      return t('mention made')
    case 'content-comment':
      return t('commented')
    case 'status-update':
      return t('status modified')
    case 'move':
      return t('moved')
    case 'copy':
      return t('copied')
    case 'unknown':
      return t('unknown')
  }

  return revisionType
}

export const buildUserConfigContentNotifyAllKey = contentId => `content.${contentId}.notify_all_members_message`
export const buildUserConfigSpaceWebNotificationKey = spaceId => `space.${spaceId}.web_notification`
export const buildUserConfigContentWebNotificationKey = contentId => `content.${contentId}.web_notification`

// INFO - CH - 2024-06-19 - This function returns whether a notification should be filtered because the user
// has unsubscribed the space
export const shouldKeepNotification = (notification, userConfig) => {
  const isIndividualMention = notification.type === `${TLM_ET.MENTION}.${TLM_CET.CREATED}` &&
    notification.mention.type !== MENTION_CONSTANT.TYPE.ROLE
  if (isIndividualMention) return true

  const notificationHasNoWorkspace = !notification.workspace || !notification.workspace.id
  if (notificationHasNoWorkspace) return true

  const isSubscriptionUndefined = userConfig[buildUserConfigSpaceWebNotificationKey(notification.workspace.id)] === undefined
  if (isSubscriptionUndefined) return true

  const isSubscribed = userConfig[buildUserConfigSpaceWebNotificationKey(notification.workspace.id)] === true
  return isSubscribed
}

// INFO - CH - 2024-06-18 - Function filterNotificationListFromUserConfig is used to filter the web notification list
// from spaces where the user has unsubscribed web notification from
export const filterNotificationListFromUserConfig = (notificationList, userConfig) => {
  if (!userConfig) return notificationList
  return notificationList.filter(notification => shouldKeepNotification(notification, userConfig))
}

// INFO - CH - 2025-01-20 - Allows to bind handler for on click outside dom element.
// See Popover.jsx for usage example.
// Use this function in place of react-onclickoutside for functional component.
// react-onclickoutside only works on class component
export function onClickOutside (listening, setListening, menuRef, setIsOpen) {
  return () => {
    if (listening) return
    if (!menuRef.current) return
    setListening(true)
    ;['click', 'touchstart'].forEach((type) => {
      document.addEventListener(type, (evt) => {
        if (menuRef.current?.contains(evt.target)) return
        setIsOpen(false)
      })
    })
  }
}

export const defaultApiContent = {
  content_id: 0,
  workspace_id: 0,
  label: '',
  filename: '',
  slug: '',
  is_deleted: false,
  content_type: '',
  file_extension: '',
  content_namespace: 'content',
  created: '',
  current_revision_id: 0,
  description: '',
  raw_content: '',
  assignee_id: null,
  actives_shares: 0,
  version_number: 0,
  is_archived: false,
  is_template: false,
  mimetype: '',
  size: 0,
  parent_id: 0,
  status: 'open',
  show_in_ui: true,
  current_revision_type: 'revision',
  modified: '',
  is_editable: true
}
