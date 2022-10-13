import { v4 as uuidv4 } from 'uuid'
import React from 'react'
import i18n from './i18n.js'
import { format, formatDistance, isAfter } from 'date-fns'
import color from 'color'
import dateFnsFr from 'date-fns/locale/fr'
import dateFnsEn from 'date-fns/locale/en-US'
import dateFnsPt from 'date-fns/locale/pt'
import dateFnsDe from 'date-fns/locale/de'
import dateFnsAr from 'date-fns/locale/ar-SA'
import dateFnsEs from 'date-fns/locale/es'
import dateFnsNbNO from 'date-fns/locale/nb'

import ErrorFlashMessageTemplateHtml from './component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'
import { CUSTOM_EVENT } from './customEvent.js'
import {
  getContentPath,
  getReservedUsernames,
  getUsernameAvailability
} from './action.async.js'

export const PAGE = {
  CONTENT: (idcts = ':idcts') => `/ui/contents/${idcts}`,
  HOME: '/ui',
  WORKSPACE: {
    ADVANCED_DASHBOARD: (idws = ':idws') => `/ui/workspaces/${idws}/advanced_dashboard`,
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
    RECENT_ACTIVITIES: (idws = ':idws') => `/ui/workspaces/${idws}/recent-activities`,
    PUBLICATION: (idws = ':idws', idcts = ':idcts') => `/ui/workspaces/${idws}/publications/${idcts}`,
    PUBLICATIONS: (idws = ':idws') => `/ui/workspaces/${idws}/publications`,
    FOLDER_OPEN: (idws = ':idws', folderList) => `/ui/workspaces/${idws}/contents?folder_open=${folderList.toString()}`
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
    USER_EDIT: (userId = ':iduser') => `/ui/admin/user/${userId}`,
    USER_SPACE_LIST: (userId = ':iduser') => `/ui/admin/user/${userId}/spaces`
  },
  SEARCH_RESULT: '/ui/search-result',
  GUEST_UPLOAD: (token = ':token') => `/ui/guest-upload/${token}`,
  GUEST_DOWNLOAD: (token = ':token') => `/ui/guest-download/${token}`,
  JOIN_WORKSPACE: '/ui/join-workspace',
  RECENT_ACTIVITIES: '/ui/recent-activities',
  ONLINE_EDITION: (contentId) => `/api/collaborative-document-edition/wopi/files/${contentId}`,
  PUBLIC_PROFILE: (userId = ':userid') => `/ui/users/${userId}/profile`,
  FAVORITES: '/ui/favorites',
  TODO: '/ui/todos'
}

export const DATE_FNS_LOCALE = {
  fr: dateFnsFr,
  en: dateFnsEn,
  pt: dateFnsPt,
  de: dateFnsDe,
  ar: dateFnsAr,
  es: dateFnsEs,
  nb_NO: dateFnsNbNO
}

// INFO - MP - 2022-06-09 - This array must stay synchronized with the supported extensions
export const COLLABORA_EXTENSIONS = [
  '.odg',
  '.odp',
  '.ods',
  '.odt'
]

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

export const convertBackslashNToBr = msg => msg.replace(/\n/g, '<br />')

export const BREADCRUMBS_TYPE = {
  CORE: 'CORE',
  APP_FULLSCREEN: 'APP_FULLSCREEN',
  APP_FEATURE: 'APP_FEATURE'
}

export const revisionTypeList = [{
  id: 'archiving',
  faIcon: 'fas fa-archive',
  tradKey: i18n.t('Item archived'),
  label: 'Item archived'
}, {
  id: 'content-comment',
  faIcon: 'far fa-comment',
  tradKey: i18n.t('Comment'),
  label: 'Comment'
}, {
  id: 'creation',
  faIcon: 'fas fa-magic',
  tradKey: i18n.t('Item created'),
  label: 'Item created'
}, {
  id: 'deletion',
  faIcon: 'far fa-trash-alt',
  tradKey: i18n.t('Item deleted'),
  label: 'Item deleted'
}, {
  id: 'edition',
  faIcon: 'fas fa-history',
  tradKey: i18n.t('New revision'),
  label: 'New revision'
}, {
  id: 'revision',
  faIcon: 'fas fa-history',
  tradKey: i18n.t('New revision'),
  label: 'New revision'
}, {
  id: 'status-update',
  faIcon: 'fas fa-random',
  label: (statusLabel) => i18n.t('Status changed to {{status}}', { status: statusLabel })
}, {
  id: 'unarchiving',
  faIcon: 'far fa-file-archive',
  tradKey: i18n.t('Item unarchived'),
  label: 'Item unarchived'
}, {
  id: 'undeletion',
  faIcon: 'far fa-trash-alt',
  tradKey: i18n.t('Item restored'),
  label: 'Item restored'
}, {
  id: 'move',
  faIcon: 'fas fa-arrows-alt',
  tradKey: i18n.t('Item moved'),
  label: 'Item moved'
}, {
  id: 'copy',
  faIcon: 'far fa-copy',
  tradKey: i18n.t('Item copied'),
  label: 'Item copied'
}, {
  id: 'mark-as-template',
  faIcon: 'fas fa-clipboard',
  tradKey: i18n.t('Item marked as template'),
  label: 'Item marked as template'
}, {
  id: 'unmark-as-template',
  faIcon: 'fas fa-paste',
  tradKey: i18n.t('Item unmarked as template'),
  label: 'Item unmarked as template'
}]

const WORKSPACE_MANAGER = {
  id: 8,
  slug: 'workspace-manager',
  faIcon: 'fas fa-gavel',
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
  faIcon: 'fas fa-graduation-cap',
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
  faIcon: 'fas fa-pencil-alt',
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
  faIcon: 'far fa-eye',
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
  faIcon: 'fas fa-shield-alt',
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
  faIcon: 'fas fa-graduation-cap',
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
  faIcon: 'fas fa-user',
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
  faIcon: 'far fa-sun',
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
  faIcon: 'far fa-handshake',
  tradKey: [
    i18n.t('On request'),
    i18n.t('Any user will be able to see and send a request to join this space, the space managers will be able to accept/reject requests.')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'On request',
  description: 'Any user will be able to see and send a request to join this space, the space managers will be able to accept/reject requests.'
}
const CONFIDENTIAL = {
  id: 4,
  hexcolor: '#B61616',
  slug: 'confidential',
  faIcon: 'fas fa-user-secret',
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
  faIcon: 'fas fa-sign-in-alt',
  tradKey: [
    i18n.t('pending')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'pending'
}
const SUBSCRIPTION_REJECTED = {
  id: 2,
  slug: 'rejected',
  faIcon: 'fas fa-times',
  tradKey: [
    i18n.t('rejected')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'rejected'
}
const SUBSCRIPTION_ACCEPTED = {
  id: 3,
  slug: 'accepted',
  faIcon: 'fas fa-check',
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
  const sizes = [i18n.t('Bytes'), i18n.t('KB'), i18n.t('MB'), i18n.t('GB'), i18n.t('TB'), i18n.t('PB'), i18n.t('EB'), i18n.t('ZB'), i18n.t('YB')]
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

export const STATUSES = {
  OPEN: 'open',
  VALIDATED: 'closed-validated',
  CANCELLED: 'closed-unvalidated',
  DEPRECATED: 'closed-deprecated'
}

export const sortContentByStatus = (contentList) => {
  return contentList.sort((contantA, contentB) => {
    if (contantA.status === STATUSES.VALIDATED && contentB.status === STATUSES.OPEN) {
      return 1
    } if (contantA.status === STATUSES.OPEN && contentB.status === STATUSES.VALIDATED) {
      return -1
    } else return 0
  })
}

export const sortContentByCreatedDateAndID = (arrayToSort) => {
  return arrayToSort.sort(function (a, b) {
    if (a.created < b.created) return 1
    if (a.created > b.created) return -1
    if (a.created === b.created) {
      if (a.id < b.id) return 1
      if (a.id > b.id) return -1
    }
    return 0
  })
}

export const buildTracimLiveMessageEventType = (entityType, coreEntityType, optionalSubType = null) => `${entityType}.${coreEntityType}${optionalSubType ? `.${optionalSubType}` : ''}`

// INFO - CH - 2019-06-11 - This object must stay synchronized with the slugs of /api/system/content_types
export const CONTENT_TYPE = {
  HTML_DOCUMENT: 'html-document',
  FILE: 'file',
  THREAD: 'thread',
  FOLDER: 'folder',
  COMMENT: 'comment',
  KANBAN: 'kanban',
  TODO: 'todo'
}

export const CONTENT_NAMESPACE = {
  CONTENT: 'content',
  UPLOAD: 'upload',
  PUBLICATION: 'publication'
}

export const TIMELINE_TYPE = {
  COMMENT: CONTENT_TYPE.COMMENT,
  COMMENT_AS_FILE: `${CONTENT_TYPE.COMMENT}AsFile`,
  REVISION: 'revision'
}

export const sortTimelineByDate = (timeline) => {
  return timeline.sort((a, b) => {
    // INFO - GB - 2021-12-07 - since we don't have the millisecond from backend, we can
    // have contents created at the same second. So we sort on revision_id for revision,
    // content_id for comments and we choose revision over comments if we have to sort between both.
    if (a.created_raw === b.created_raw) {
      if (a.revision_id && b.revision_id) return parseInt(a.revision_id) - parseInt(b.revision_id)
      if (!a.revision_id && !b.revision_id) return parseInt(a.content_id) - parseInt(b.content_id)
      else return a.revision_id ? -1 : 1
    }
    return isAfter(new Date(a.created_raw), new Date(b.created_raw)) ? 1 : -1
  })
}

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

export const naturalCompareLabels = (itemA, itemB, lang) => {
  // 2020-09-04 - RJ - WARNING. Option ignorePunctuation is seducing but makes the sort unstable.
  return naturalCompare(itemA, itemB, lang, 'label')
}

export const naturalCompare = (itemA, itemB, lang, field) => {
  // 2020-09-04 - RJ - WARNING. Option ignorePunctuation is seducing but makes the sort unstable.
  const locale = lang ? lang.replaceAll('_', '-') : undefined
  return itemA[field].localeCompare(itemB[field], locale, { numeric: true })
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

export const USER_CALL_STATE = {
  IN_PROGRESS: 'in_progress',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  UNANSWERED: 'unanswered'
}

export const USERNAME_ALLOWED_CHARACTERS_REGEX = /[a-zA-Z0-9\-_]/

const seekUsernameEnd = (text, offset) => {
  while (offset < text.length && USERNAME_ALLOWED_CHARACTERS_REGEX.test(text[offset])) {
    offset++
  }

  return offset
}

export const tinymceRemove = (selector) => {
  try {
    globalThis.tinymce.remove(selector)
  } catch (e) {
    if (e instanceof TypeError) {
      console.error('HACK(#5437): removing TinyMCE raised a TypeError exception. If the message looks like "Can\'t access dead object". Ignoring the exception but please fix this.', e)
    } else {
      throw e
    }
  }
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

export const sortMemberList = (a, b) => a.publicName.localeCompare(b.publicName)
