import { v4 as uuidv4 } from 'uuid'
import React from 'react'
import { Link } from 'react-router-dom'
import i18n from './i18n.js'
import { distanceInWords, isAfter } from 'date-fns'
import color from 'color'
import ErrorFlashMessageTemplateHtml from './component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'
import { CUSTOM_EVENT } from './customEvent.js'
import {
  getContentPath,
  getReservedUsernames,
  getUsernameAvailability
} from './action.async.js'

export const PAGE = {
  HOME: '/ui',
  WORKSPACE: {
    ROOT: '/ui/workspaces',
    DASHBOARD: (idws = ':idws') => `/ui/workspaces/${idws}/dashboard`,
    NEW: (idws, type) => `/ui/workspaces/${idws}/contents/${type}/new`,
    AGENDA: (idws = ':idws') => `/ui/workspaces/${idws}/agenda`,
    CONTENT_LIST: (idws = ':idws') => `/ui/workspaces/${idws}/contents`,
    CONTENT: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}`,
    SHARE_FOLDER: (idws = ':idws') => `/ui/workspaces/${idws}/contents/share_folder`,
    ADMIN: (idws = ':idws') => `/ui/workspaces/${idws}/admin`,
    CONTENT_EDITION: (idws = ':idws', idcts = ':idcts') => `/ui/online_edition/workspaces/${idws}/contents/${idcts}`,
    GALLERY: (idws = ':idws') => `/ui/workspaces/${idws}/gallery`,
    ACTIVITY_FEED: (idws = ':idws') => `/ui/workspaces/${idws}/activity-feed`
  },
  LOGIN: '/ui/login',
  FORGOT_PASSWORD: '/ui/forgot-password',
  FORGOT_PASSWORD_NO_EMAIL_NOTIF: '/ui/forgot-password-no-email-notif',
  RESET_PASSWORD: '/ui/reset-password',
  ACCOUNT: '/ui/account',
  AGENDA: '/ui/agenda',
  ADMIN: {
    ROOT: '/ui/admin',
    WORKSPACE: '/ui/admin/workspace',
    USER: '/ui/admin/user',
    USER_EDIT: (userId = ':iduser') => `/ui/admin/user/${userId}`
  },
  SEARCH_RESULT: '/ui/search-result',
  GUEST_UPLOAD: (token = ':token') => `/ui/guest-upload/${token}`,
  GUEST_DOWNLOAD: (token = ':token') => `/ui/guest-download/${token}`,
  JOIN_WORKSPACE: '/ui/join-workspace',
  ACTIVITY_FEED: '/ui/activity-feed',
  ONLINE_EDITION: (contentId) => `/api/collaborative-document-edition/wopi/files/${contentId}`
}

const dateFnsLocale = {
  fr: require('date-fns/locale/fr'),
  en: require('date-fns/locale/en'),
  pt: require('date-fns/locale/pt')
}

export const generateFetchResponse = async fetchResult => {
  const resultJson = await fetchResult.clone().json()
  return new Promise((resolve, reject) => resolve({
    apiResponse: fetchResult,
    body: resultJson
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

export const displayDistanceDate = (dateToDisplay, lang) => distanceInWords(new Date(), dateToDisplay, { locale: dateFnsLocale[lang], addSuffix: true })

export const convertBackslashNToBr = msg => msg.replace(/\n/g, '<br />')

export const BREADCRUMBS_TYPE = {
  CORE: 'CORE',
  APP_FULLSCREEN: 'APP_FULLSCREEN',
  APP_FEATURE: 'APP_FEATURE'
}

export const revisionTypeList = [{
  id: 'archiving',
  faIcon: 'archive',
  label: i18n.t('Item archived')
}, {
  id: 'content-comment',
  faIcon: 'comment-o',
  label: i18n.t('Comment')
}, {
  id: 'creation',
  faIcon: 'magic',
  label: i18n.t('Item created')
}, {
  id: 'deletion',
  faIcon: 'trash',
  label: i18n.t('Item deleted')
}, {
  id: 'edition',
  faIcon: 'edit',
  label: i18n.t('New revision')
}, {
  id: 'revision',
  faIcon: 'history',
  label: i18n.t('New revision')
}, {
  id: 'status-update',
  faIcon: 'random',
  label: statusLabel => i18n.t('Status changed to {{status}}', { status: statusLabel })
}, {
  id: 'unarchiving',
  faIcon: 'file-archive-o',
  label: i18n.t('Item unarchived')
}, {
  id: 'undeletion',
  faIcon: 'trash-o',
  label: i18n.t('Item restored')
}, {
  id: 'move',
  faIcon: 'arrows',
  label: i18n.t('Item moved')
}, {
  id: 'copy',
  faIcon: 'files-o',
  label: i18n.t('Item copied')
}]

const WORKSPACE_MANAGER = {
  id: 8,
  slug: 'workspace-manager',
  faIcon: 'gavel',
  hexcolor: '#ed0007',
  tradKey: [
    i18n.t('Space manager'),
    i18n.t('Content manager + add members and edit spaces')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Space manager', // label must be used in components
  description: 'Content manager + add members and edit spaces'
}
const CONTENT_MANAGER = {
  id: 4,
  slug: 'content-manager',
  faIcon: 'graduation-cap',
  hexcolor: '#f2af2d',
  tradKey: [
    i18n.t('Content manager'),
    i18n.t('Contributor + create folders and manage contents')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Content manager', // label must be used in components
  description: 'Contributor + create folders and manage contents'
}
const CONTRIBUTOR = {
  id: 2,
  slug: 'contributor',
  faIcon: 'pencil',
  hexcolor: '#3145f7',
  tradKey: [
    i18n.t('Contributor'),
    i18n.t('Reader + create/modify content')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Contributor', // label must be used in components
  description: 'Reader + create/modify content'
}
const READER = {
  id: 1,
  slug: 'reader',
  faIcon: 'eye',
  hexcolor: '#15d948',
  tradKey: [
    i18n.t('Reader'),
    i18n.t('Read contents')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Reader', // label must be used in components
  description: 'Read contents'
}
export const ROLE = {
  workspaceManager: WORKSPACE_MANAGER,
  contentManager: CONTENT_MANAGER,
  contributor: CONTRIBUTOR,
  reader: READER
}
export const ROLE_LIST = [WORKSPACE_MANAGER, CONTENT_MANAGER, CONTRIBUTOR, READER]

const ADMINISTRATOR = {
  id: 3,
  slug: 'administrators',
  faIcon: 'shield',
  hexcolor: '#ed0007',
  tradKey: [
    i18n.t('Administrator'),
    i18n.t('Trusted user + create users, administration of instance')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Administrator', // label must be used in components
  description: 'Trusted user + create users, administration of instance'
}
const MANAGER = {
  id: 2,
  slug: 'trusted-users',
  faIcon: 'graduation-cap',
  hexcolor: '#f2af2d',
  tradKey: [
    i18n.t('Trusted user'),
    i18n.t('User + create spaces, add members in spaces')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Trusted user', // label must be used in components
  description: 'User + create spaces, add members in spaces'
}
const USER = {
  id: 1,
  slug: 'users',
  faIcon: 'user',
  hexcolor: '#3145f7',
  tradKey: [
    i18n.t('User'),
    i18n.t('Access to spaces where user is member')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'User', // label must be used in components
  description: 'Access to spaces where user is member'
}
export const PROFILE = {
  administrator: ADMINISTRATOR,
  manager: MANAGER,
  user: USER
}
export const PROFILE_LIST = [ADMINISTRATOR, MANAGER, USER]

const OPEN = {
  id: 2,
  slug: 'open',
  faIcon: 'sun-o',
  tradKey: [
    i18n.t('Open'),
    i18n.t('Any user will be able to see, join and open this space.')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Open',
  description: 'Any user will be able to see, join and open this space.'
}
const ON_REQUEST = {
  id: 3,
  slug: 'on_request',
  faIcon: 'handshake-o',
  tradKey: [
    i18n.t('On request'),
    i18n.t('Any user will be able to see and send a request to join this space, the space managers will be able to accept/reject requests.')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'On request',
  description: 'Any user will be able to see and send a request to join this space, the space managers will be able to accept/reject requests.'
}
const CONFIDENTIAL = {
  id: 4,
  slug: 'confidential',
  faIcon: 'user-secret',
  tradKey: [
    i18n.t('Confidential'),
    i18n.t('Only invited users will be able to see and open this space, invitation is sent by space managers.')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Confidential',
  description: 'Only invited users will be able to see and open this space, invitation is sent by space managers.'
}
export const SPACE_TYPE = {
  open: OPEN,
  onRequest: ON_REQUEST,
  confidential: CONFIDENTIAL
}

// INFO - GB - 2020-11-04 - The order of types in SPACE_TYPE_LIST is important to PopupCreateWorkspace.jsx. CONFIDENTIAL needs to be first.
export const SPACE_TYPE_LIST = [CONFIDENTIAL, ON_REQUEST, OPEN]
export const ACCESSIBLE_SPACE_TYPE_LIST = [OPEN, ON_REQUEST]

const SUBSCRIPTION_PENDING = {
  id: 1,
  slug: 'pending',
  faIcon: 'sign-in',
  tradKey: [
    i18n.t('pending')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'pending'
}
const SUBSCRIPTION_REJECTED = {
  id: 2,
  slug: 'rejected',
  faIcon: 'times',
  tradKey: [
    i18n.t('rejected')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'rejected'
}
const SUBSCRIPTION_ACCEPTED = {
  id: 3,
  slug: 'accepted',
  faIcon: 'check',
  tradKey: [
    i18n.t('accepted')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'accepted'
}
export const SUBSCRIPTION_TYPE = {
  pending: SUBSCRIPTION_PENDING,
  rejected: SUBSCRIPTION_REJECTED,
  accepted: SUBSCRIPTION_ACCEPTED
}
export const SUBSCRIPTION_TYPE_LIST = [SUBSCRIPTION_PENDING, SUBSCRIPTION_REJECTED, SUBSCRIPTION_ACCEPTED]

export const APP_FEATURE_MODE = {
  VIEW: 'view',
  EDIT: 'edit',
  REVISION: 'revision'
}

export const updateTLMAuthor = author => {
  return author
    ? { ...author, is_from_system_admin: false }
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
      public_name: i18n.t('System Administrator'),
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
  const sizes = [i18n.t('Bytes'), i18n.t('KB'), i18n.t('MB'), i18n.t('GB'), i18n.t('TB'), i18n.t('PB'), i18n.t('EB'), i18n.t('ZB'), i18n.t('YB')]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const parserStringToList = (string, separatorList = [',', ';', '\n']) => {
  let parsedString = string
  separatorList.forEach(separator => {
    parsedString = parsedString.split(separator).join(',')
  })
  return parsedString.split(',').filter(notEmptyString => notEmptyString !== '')
}

// INFO - GB - 2019-07-31 - This function check if the email has three parts arranged like somethig@something.somethig
export const checkEmailValidity = email => {
  const parts = email.split('@')
  if (parts.length !== 2) return false

  const domainParts = parts[1].split('.')
  return domainParts.length === 2
}

export const buildFilePreviewUrl = (apiUrl, workspaceId, contentId, revisionId, filenameNoExtension, page, width, height) => {
  const rev = revisionId ? `/revisions/${revisionId}` : ''
  return `${apiUrl}/workspaces/${workspaceId}/files/${contentId}${rev}/preview/jpg/${width}x${height}/${encodeURIComponent(filenameNoExtension) + '.jpg'}?page=${page}`
}

export const removeExtensionOfFilename = filename => filename.split('.').splice(0, (filename.split('.').length - 1)).join('.')

export const computeProgressionPercentage = (progressionLoaded, progressionTotal, elementListLength = 1) => (progressionLoaded / progressionTotal * 99) / elementListLength

export const FILE_PREVIEW_STATE = {
  NO_PREVIEW: 'noPreview',
  NO_FILE: 'noFile'
}

export const buildHeadTitle = words => words.reduce((acc, curr) => acc !== '' ? `${acc} · ${curr}` : curr, '')

export const IMG_LOAD_STATE = {
  LOADED: 'loaded',
  LOADING: 'loading',
  ERROR: 'error'
}

export const buildTracimLiveMessageEventType = (entityType, coreEntityType, optionalSubType = null) => `${entityType}.${coreEntityType}${optionalSubType ? `.${optionalSubType}` : ''}`

// INFO - CH - 2019-06-11 - This object must stay synchronized with the slugs of /api/system/content_types
export const CONTENT_TYPE = {
  HTML_DOCUMENT: 'html-document',
  FILE: 'file',
  THREAD: 'thread',
  FOLDER: 'folder',
  COMMENT: 'comment'
}

export const TIMELINE_TYPE = {
  COMMENT: CONTENT_TYPE.COMMENT,
  REVISION: 'revision'
}

export const sortTimelineByDate = (timeline) => {
  return timeline.sort((a, b) => isAfter(new Date(a.created_raw), new Date(b.created_raw)) ? 1 : -1)
}

export const addRevisionFromTLM = (data, timeline, lang, isTokenClient = true) => {
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

  const revisionNumber = 1 + timeline.filter(tl => tl.timelineType === 'revision').length

  return [
    ...timeline,
    {
      ...revisionObject,
      author: {
        public_name: data.author.public_name,
        avatar_url: data.author.avatar_url,
        user_id: data.author.user_id
      },
      commentList: [], // INFO - GB - 2020-05-29 For now it is not possible to get commentList and comment_ids via TLM message, and since such properties are not used, we leave them empty.
      comment_ids: [],
      created: displayDistanceDate(data.content.modified, lang),
      created_raw: data.content.modified,
      number: revisionNumber,
      revision_id: data.content.current_revision_id,
      revision_type: data.content.current_revision_type,
      timelineType: 'revision',
      hasBeenRead: isTokenClient
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
  return timeline.filter(t => t.timelineType === 'revision' && t.hasBeenRead).length
}

export const MINIMUM_CHARACTERS_USERNAME = 3
export const MAXIMUM_CHARACTERS_USERNAME = 255
export const ALLOWED_CHARACTERS_USERNAME = 'azAZ09-_'
export const CHECK_USERNAME_DEBOUNCE_WAIT = 250

export const NUMBER_RESULTS_BY_PAGE = 15

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

  // INFO - GB - 2020-06-08 The allowed characters are azAZ09-_
  if (!(/^[A-Za-z0-9_-]*$/.test(username))) {
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

export const formatAbsoluteDate = (rawDate, lang) => new Date(rawDate).toLocaleString(lang)

// Equality test done as numbers with the following rules:
// - strings are converted to numbers before comparing
// - undefined and null are converted to 0 before comparing
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

export const naturalCompareLabels = (itemA, itemB, lang) => {
  // 2020-09-04 - RJ - WARNING. Option ignorePunctuation is seducing but makes the sort unstable.
  return itemA.label.localeCompare(itemB.label, lang, { numeric: true })
}

export const sortWorkspaceList = (workspaceList, lang) => {
  return workspaceList.sort((a, b) => {
    let res = naturalCompareLabels(a, b, lang)
    if (!res) {
      res = getSpaceId(a) - getSpaceId(b)
    }
    return res
  })
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

export const darkenColor = (c) => color(c).darken(0.15).hex()
export const lightenColor = (c) => color(c).lighten(0.15).hex()

export const buildContentPathBreadcrumbs = async (apiUrl, content, props) => {
  const fetchGetContentPath = await handleFetchResult(
    await getContentPath(apiUrl, content.workspace_id, content.content_id)
  )

  switch (fetchGetContentPath.apiResponse.status) {
    case 200:
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.APPEND_BREADCRUMBS,
        data: {
          breadcrumbs: fetchGetContentPath.body.items.map(crumb => ({
            url: PAGE.WORKSPACE.CONTENT(content.workspace_id, crumb.content_type, crumb.content_id),
            label: crumb.label,
            link: (
              <Link to={PAGE.WORKSPACE.CONTENT(content.workspace_id, crumb.content_type, crumb.content_id)}>
                {crumb.label}
              </Link>
            ),
            type: BREADCRUMBS_TYPE.APP_FEATURE
          }))
        }
      })
      break
    default:
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: props.t('Error while getting breadcrumbs'),
          type: 'warning',
          delay: undefined
        }
      })
  }
}
