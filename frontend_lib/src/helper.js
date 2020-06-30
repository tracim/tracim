import { v4 as uuidv4 } from 'uuid';
import React from 'react'
import i18n from './i18n.js'
import { distanceInWords, isAfter } from 'date-fns'
import ErrorFlashMessageTemplateHtml from './component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'
import { CUSTOM_EVENT } from './customEvent.js'

var dateFnsLocale = {
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

export const generateLocalStorageContentId = (workspaceId, contentId, contentType, dataType) => `${workspaceId}/${contentId}/${contentType}_${dataType}`

const WORKSPACE_MANAGER = {
  id: 8,
  slug: 'workspace-manager',
  faIcon: 'gavel',
  hexcolor: '#ed0007',
  tradKey: [
    i18n.t('Shared space manager'),
    i18n.t('Content manager + add members and edit shared spaces')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Shared space manager', // label must be used in components
  description: 'Content manager + add members and edit shared spaces'
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
    i18n.t('User + create shared spaces, add members in shared spaces')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Trusted user', // label must be used in components
  description: 'User + create shared spaces, add members in shared spaces'
}
const USER = {
  id: 1,
  slug: 'users',
  faIcon: 'user',
  hexcolor: '#3145f7',
  tradKey: [
    i18n.t('User'),
    i18n.t('Access to shared spaces where user is member')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'User', // label must be used in components
  description: 'Access to shared spaces where user is member'
}
export const PROFILE = {
  administrator: ADMINISTRATOR,
  manager: MANAGER,
  user: USER
}
export const PROFILE_LIST = [ADMINISTRATOR, MANAGER, USER]

export const APP_FEATURE_MODE = {
  VIEW: 'view',
  EDIT: 'edit',
  REVISION: 'revision'
}

// INFO - GB - 2019-07-05 - This password generator function was based on
// https://stackoverflow.com/questions/5840577/jquery-or-javascript-password-generator-with-at-least-a-capital-and-a-number
export const generateRandomPassword = () => {
  let password = []
  let charCode = String.fromCharCode
  let randomNumber = Math.random
  let random, i

  for (i = 0; i < 10; i++) { // password with a size 10
    random = 0 | randomNumber() * 62 // generate upper OR lower OR number
    password.push(charCode(48 + random + (random > 9 ? 7 : 0) + (random > 35 ? 6 : 0)))
  }
  let randomPassword = password.sort(() => { return randomNumber() - 0.5 }).join('')

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
  'Accept': 'application/json',
  'X-Tracim-ClientToken': getOrCreateSessionClientToken()
}

export const FETCH_CONFIG = {
  headers: {
    ...COMMON_REQUEST_HEADERS,
    'Content-Type': 'application/json',
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

export const buildFilePreviewUrl = (apiUrl, workspaceId, contentId, revisionId, filenameNoExtension, page, width, height) =>
  `${apiUrl}/workspaces/${workspaceId}/files/${contentId}/revisions/${revisionId}/preview/jpg/${width}x${height}/${filenameNoExtension + '.jpg'}?page=${page}`

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

export const sortTimelineByDate = (timeline) => {
  return timeline.sort((a, b) => isAfter(new Date(a.created_raw), new Date(b.created_raw)) ? 1 : -1)
}

export const addRevisionFromTLM = (data, timeline, lang) => {
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

  const revisionNumber = 1 + timeline.filter(tl => tl.timelineType === 'revision' ).length

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
      timelineType: 'revision'
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

// INFO - GB - 2020-06-08 The allowed characters are azAZ09-_
export const hasNotAllowedCharacters = name => !(/^[A-Za-z0-9_-]*$/.test(name))

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
