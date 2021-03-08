import i18n, { getBrowserLang } from './i18n.js'
import {
  FETCH_CONFIG as LIB_FETCH_CONFIG,
  naturalCompareLabels,
  PAGE,
  PROFILE_LIST,
  ROLE
} from 'tracim_frontend_lib'

const configEnv = process.env.NODE_ENV === 'test' ? require('../../configEnv-test.json') : require('../../configEnv.json')

const versionFile = require('../version.json')
export const TRACIM_APP_VERSION = versionFile.tracim_app_version
export const SHARE_FOLDER_ID = -1
export const MINIMUM_CHARACTERS_PUBLIC_NAME = 3
export const NO_ACTIVE_SPACE_ID = -1

export const history = require('history').createBrowserHistory()

// this function is declared in i18n to avoid cyclic imports and reexported here for consistency
export { getBrowserLang }

export const FETCH_CONFIG = {
  headers: LIB_FETCH_CONFIG.headers,
  apiUrl: configEnv.apiUrl
}

export const SEARCH_TYPE = {
  SIMPLE: 'simple',
  ADVANCED: 'elasticsearch'
}

export const ADVANCED_SEARCH_TYPE = {
  CONTENT: 'content',
  USER: 'user',
  SPACE: 'workspace'
}

export const ADVANCED_SEARCH_FILTER = {
  SEARCH_FIELD: 'searchField',
  NEWEST_AUTHORED_CONTENT_RANGE: 'newestAuthoredContentRange',
  CREATED_RANGE: 'createdRange',
  MODIFIED_RANGE: 'modifiedRange',
  SEARCH_FACETS: 'searchFacets'
}

export const DATE_FILTER_ELEMENT = {
  AFTER: 'after',
  BEFORE: 'before'
}

// INFO - G.B. - 2021-03-01 - All the translations in the object below has as their only purpose
// to be able to generate translation keys through i18n.scanner

export const SEARCH_USER_FACETS = {
  MEMBER: {
    slug: 'members'
  }
}

export const SEARCH_CONTENT_FACETS = {
  SPACE: {
    slug: 'workspace_names'
  },
  STATUS: {
    slug: 'statuses',
    items: [
      i18n.t('open'),
      i18n.t('closed-deprecated'),
      i18n.t('closed-unvalidated'),
      i18n.t('closed-validated')
    ]
  },
  TYPE: {
    slug: 'content_types',
    items: [
      i18n.t('folder_search'),
      i18n.t('html-document_search'),
      i18n.t('thread_search'),
      i18n.t('file_search')
    ]
  },
  EXTENSION: {
    slug: 'file_extensions'
  },
  AUTHOR: {
    slug: 'author__public_names'
  }
}

export const SEARCH_SPACE_FACETS = {
  MEMBER: {
    slug: 'members'
  },
  AUTHOR: {
    slug: 'owners'
  }
}

export const ANCHOR_NAMESPACE = {
  workspaceItem: 'workspaceItem'
}

// Côme - 2018/08/02 - shouldn't this come from api ?
export const workspaceConfig = {
  slug: 'workspace',
  faIcon: 'fas fa-users',
  hexcolor: GLOBAL_primaryColor,
  creationLabel: i18n.t('Create a space'),
  domContainer: 'appFeatureContainer'
}

export const unLoggedAllowedPageList = [
  PAGE.LOGIN,
  PAGE.FORGOT_PASSWORD,
  PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF,
  PAGE.RESET_PASSWORD,
  PAGE.GUEST_UPLOAD(''),
  PAGE.GUEST_DOWNLOAD('')
]

export const findUserRoleIdInWorkspace = (userId, memberList, roleList) => {
  const user = memberList.find(u => u.id === userId) || { role: ROLE.reader.slug }
  return (roleList.find(r => user.role === r.slug) || { id: 1 }).id
}

export const COOKIE_FRONTEND = {
  LAST_CONNECTION: 'lastConnection',
  DEFAULT_LANGUAGE: 'defaultLanguage',
  DEFAULT_EXPIRE_TIME: 180,
  HIDE_USERNAME_POPUP: 'hideUsernamePopup'
}

export const getUserProfile = slug => PROFILE_LIST.find(p => slug === p.slug) || {}

const USER_AUTH_INTERNAL = 'internal'
const USER_AUTH_UNKNOWN = 'unknown'
export const editableUserAuthTypeList = [USER_AUTH_INTERNAL, USER_AUTH_UNKNOWN]

export const DRAG_AND_DROP = {
  CONTENT_ITEM: 'contentItem'
}

// Côme - 2018/09/19 - the object bellow is a temporary hack to be able to generate translation keys that only exists in backend
// and are returned through api.
// We will later implement a better solution
// this const isn't exported since it's only purpose is to generate key trads through i18n.scanner
const backendTranslationKeyList = [ // eslint-disable-line no-unused-vars
  i18n.t('Dashboard'),
  i18n.t('Contents'),
  i18n.t('Opened'),
  i18n.t('Validated'),
  i18n.t('Cancelled'),
  i18n.t('Deprecated')
]

export const ALL_CONTENT_TYPES = 'html-document,file,thread,folder,comment'

export const compareContents = (a, b, lang) => {
  if (a.type === 'folder' && b.type !== 'folder') return -1
  if (b.type === 'folder' && a.type !== 'folder') return 1
  return naturalCompareLabels(a, b, lang)
}

export const CONTENT_NAMESPACE = {
  CONTENT: 'content',
  UPLOAD: 'upload'
}

export const sortContentList = (workspaceContents, lang) => {
  return workspaceContents.sort((a, b) => compareContents(a, b, lang))
}

export const toggleFavicon = (hasNewNotification) => {
  const originalHrefAttribute = 'originalHrefAttribute'

  document.getElementsByClassName('tracim__favicon').forEach(favicon => {
    if (!hasNewNotification) {
      favicon.href = favicon.getAttribute(originalHrefAttribute)
      favicon.removeAttribute(originalHrefAttribute)
      return
    }
    const faviconSize = favicon.sizes[0].split('x')[0]

    const canvas = document.createElement('canvas')
    canvas.width = faviconSize
    canvas.height = faviconSize

    const context = canvas.getContext('2d')
    const img = document.createElement('img')
    img.src = favicon.href

    img.onload = () => {
      // INFO - GM - 2020/08/18 - Draw Original Favicon as Background
      context.drawImage(img, 0, 0, faviconSize, faviconSize)

      // INFO - GM - 2020/08/18 - Draw Notification Circle
      const circleSize = faviconSize / 6
      context.beginPath()
      context.arc(
        canvas.width - circleSize,
        canvas.height - circleSize,
        circleSize,
        0,
        2 * Math.PI
      )
      // FIXME - GM - 2020/08/18 - Replace this hardcoded values to webpack variables
      // https://github.com/tracim/tracim/issues/2098
      context.fillStyle = '#3F9FF7'
      context.fill()

      // INFO - GM - 2020/08/18 - Replace the favicon
      if (!favicon.getAttribute(originalHrefAttribute)) favicon.setAttribute(originalHrefAttribute, favicon.href)
      favicon.href = canvas.toDataURL('image/png')
    }
  })
}

export const parseSearchUrl = (parsedQuery) => {
  const searchObject = {}

  searchObject.contentTypes = parsedQuery.t
  searchObject.searchString = parsedQuery.q || ''
  searchObject.numberResultsByPage = parseInt(parsedQuery.nr)
  searchObject.currentPage = parseInt(parsedQuery.p)
  searchObject.showArchived = !!(parseInt(parsedQuery.arc))
  searchObject.showDeleted = !!(parseInt(parsedQuery.del))
  searchObject.showActive = !!(parseInt(parsedQuery.act))
  searchObject.searchType = parsedQuery.s

  return searchObject
}
