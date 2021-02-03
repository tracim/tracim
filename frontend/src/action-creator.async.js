import React from 'react'
import {
  FETCH_CONFIG,
  COOKIE_FRONTEND,
  unLoggedAllowedPageList,
  history
} from './util/helper.js'
import i18n from './util/i18n.js'
import * as Cookies from 'js-cookie'
import {
  APP_LIST,
  ABOUT_USER,
  CONFIG,
  CONTENT,
  CONTENT_TYPE_LIST,
  FOLDER,
  FOLDER_READ,
  newFlashMessage,
  NOTIFICATION,
  NOTIFICATION_LIST,
  NOTIFICATION_NOT_READ_COUNT,
  SEARCHED_KEYWORDS,
  setRedirectLogin,
  setUserDisconnected,
  USER,
  USER_CONFIGURATION,
  USER_CONNECTED,
  USER_EMAIL,
  USER_KNOWN_MEMBER_LIST,
  USER_LANG,
  USER_LOGIN,
  USER_LOGOUT,
  USER_PASSWORD,
  USER_PUBLIC_NAME,
  USER_REQUEST_PASSWORD,
  USER_USERNAME,
  USER_WORKSPACE_DO_NOTIFY,
  USER_WORKSPACE_LIST,
  WORKSPACE,
  WORKSPACE_AGENDA_URL,
  WORKSPACE_CONTENT_ARCHIVED,
  WORKSPACE_CONTENT_DELETED,
  WORKSPACE_CONTENT_MOVE,
  WORKSPACE_CONTENT_PATH,
  WORKSPACE_CONTENT_SHARE_FOLDER,
  WORKSPACE_DETAIL,
  WORKSPACE_LIST,
  WORKSPACE_MEMBER_ADD,
  WORKSPACE_MEMBER_LIST,
  WORKSPACE_MEMBER_REMOVE,
  WORKSPACE_READ_STATUS,
  WORKSPACE_RECENT_ACTIVITY,
  ACCESSIBLE_WORKSPACE_LIST,
  WORKSPACE_SUBSCRIPTION_LIST,
  CUSTOM_PROPERTIES_UI_SCHEMA,
  CUSTOM_PROPERTIES_SCHEMA,
  USER_PUBLIC_PROFILE
} from './action-creator.sync.js'
import {
  ErrorFlashMessageTemplateHtml,
  updateTLMAuthor,
  NUMBER_RESULTS_BY_PAGE,
  PAGE,
  TLM_CORE_EVENT_TYPE,
  TLM_ENTITY_TYPE
} from 'tracim_frontend_lib'

/*
 * fetchWrapper(obj)
 *
 * Params:
 *   An Object with the following attributes :
 *     url - string - url of the end point to call
 *     param - object - param to send with fetch call (eg. header)
 *       param.method - string - REQUIRED - method of the http call
 *     actionName - string - name of the action to dispatch with 'PENDING' and 'SUCCESS' respectively before and after the http request
 *     dispatch - func - redux dispatcher function
 *
 * Returns:
 *   An object Response generated by whatwg-fetch with a new property 'json' containing the data received or informations in case of failure
 *
 * This function create a http async request using whatwg-fetch while dispatching a PENDING and a SUCCESS redux action.
 * It also adds, to the Response of the fetch request, the json value so that the redux action have access to the status and the data
 */
// Côme - 2018/08/02 - fetchWrapper should come from tracim_lib so that all apps uses the same
// 08/09/2018 - maybe not since this fetchWrapper also dispatch redux actions whether it succeed or failed
const fetchWrapper = async ({ url, param, actionName, dispatch }) => {
  dispatch({ type: `${param.method}/${actionName}/PENDING` })

  try {
    const fetchResult = await fetch(url, param)
    fetchResult.json = await (async () => { // await for the .json()
      const status = fetchResult.status
      if (status === 204) return ''
      if (status >= 200 && status <= 299) return fetchResult.json()
      if (status >= 300 && status <= 399) return fetchResult.json()
      if (status === 401) {
        // FIME - GB - 2019-02-08 - Find a better way of handling the list of unLoggedAllowedPageList
        // https://github.com/tracim/tracim/issues/2144
        if (!unLoggedAllowedPageList.some(url => document.location.pathname.startsWith(url))) {
          dispatch(setRedirectLogin(document.location.pathname + document.location.search))
          dispatch(setUserDisconnected())
          history.push(`${PAGE.LOGIN}${Cookies.get(COOKIE_FRONTEND.LAST_CONNECTION) ? '?dc=1' : ''}`)
          Cookies.remove(COOKIE_FRONTEND.LAST_CONNECTION)
        }
        return ''
      }
      if (status >= 400 && status <= 499) return fetchResult.json()
      if (status >= 500 && status <= 599) {
        dispatch(newFlashMessage(i18n.t('Unexpected error, please inform an administrator'), 'danger', 8000))
        return
      }

      dispatch(newFlashMessage(
        <ErrorFlashMessageTemplateHtml errorMsg={`Unknown http status ${fetchResult.status}`} />, 'danger', 300000
      ))
    })()

    const status = fetchResult.status
    if (status >= 200 && status <= 399) {
      dispatch({ type: `${param.method}/${actionName}/SUCCESS`, data: fetchResult.json })
    } else {
      dispatch({ type: `${param.method}/${actionName}/FAILED`, data: fetchResult.json })
    }

    return fetchResult
  } catch (e) {
    if (e instanceof TypeError) {
      dispatch(newFlashMessage(i18n.t('Server unreachable'), 'danger'))
      console.error(e)
    }
    return { status: 'failedToFetch' } // Côme - 2018/10/08 - this status is unused, the point is only to return an object with a status attribute
  }
}

export const postUserLogin = (credentials, rememberMe) => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/login`,
    param: {
      credentials: 'include',
      headers: { ...FETCH_CONFIG.headers },
      method: 'POST',
      body: JSON.stringify({
        ...credentials
        // remember_me: rememberMe
      })
    },
    actionName: USER_LOGIN,
    dispatch
  })
}

export const postForgotPassword = login => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/password/reset/request`,
    param: {
      credentials: 'include',
      headers: { ...FETCH_CONFIG.headers },
      method: 'POST',
      body: JSON.stringify({
        ...login
      })
    },
    actionName: USER_REQUEST_PASSWORD,
    dispatch
  })
}

export const postResetPassword = (newPassword, newPassword2, email, token) => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/password/reset/modify`,
    param: {
      credentials: 'include',
      headers: { ...FETCH_CONFIG.headers },
      method: 'POST',
      body: JSON.stringify({
        email: email,
        new_password: newPassword,
        new_password2: newPassword2,
        reset_password_token: token
      })
    },
    actionName: USER_REQUEST_PASSWORD,
    dispatch
  })
}

export const postUserLogout = () => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/logout`,
    param: {
      credentials: 'include',
      headers: { ...FETCH_CONFIG.headers },
      method: 'POST'
    },
    actionName: USER_LOGOUT,
    dispatch
  })
}

export const getUser = userId => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: USER,
    dispatch
  })
}

export const getAboutUser = userId => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/about`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: ABOUT_USER,
    dispatch
  })
}

export const getUserConfiguration = userId => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/config`,
    param: {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'GET'
    },
    actionName: USER_CONFIGURATION,
    dispatch
  })
}

export const getUserWorkspaceList = (userId, showOwnedWorkspace) => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/workspaces?show_owned_workspace=${showOwnedWorkspace ? 1 : 0}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: USER_WORKSPACE_LIST,
    dispatch
  })
}

export const getUserIsConnected = () => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/whoami`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: USER_CONNECTED,
    dispatch
  })
}

export const getMyselfKnownMember = (userNameToSearch, workspaceIdToExclude) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/known_members?acp=${userNameToSearch}&exclude_workspace_ids=${workspaceIdToExclude}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: USER_KNOWN_MEMBER_LIST,
    dispatch
  })
}

export const putMyselfName = (user, newName) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        public_name: newName,
        timezone: user.timezone,
        lang: user.lang
      })
    },
    actionName: USER_PUBLIC_NAME,
    dispatch
  })
}

export const putUserPublicName = (user, newName) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.userId}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        public_name: newName,
        timezone: user.timezone,
        lang: user.lang
      })
    },
    actionName: USER_PUBLIC_NAME,
    dispatch
  })
}

export const putUserUsername = (user, newUsername, checkPassword) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.userId}/username`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        username: newUsername,
        loggedin_user_password: checkPassword
      })
    },
    actionName: USER_USERNAME,
    dispatch
  })
}

export const putMyselfEmail = (newEmail, checkPassword) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/email`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        email: newEmail,
        loggedin_user_password: checkPassword
      })
    },
    actionName: USER_EMAIL,
    dispatch
  })
}

export const putUserEmail = (user, newEmail, checkPassword) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.userId}/email`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        email: newEmail,
        loggedin_user_password: checkPassword
      })
    },
    actionName: USER_EMAIL,
    dispatch
  })
}

export const putMyselfPassword = (oldPassword, newPassword, newPassword2) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/password`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        loggedin_user_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2
      })
    },
    actionName: USER_PASSWORD,
    dispatch
  })
}

export const putUserPassword = (userId, oldPassword, newPassword, newPassword2) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/password`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        loggedin_user_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2
      })
    },
    actionName: USER_PASSWORD,
    dispatch
  })
}

export const putUserLang = (user, newLang) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.userId}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        public_name: user.publicName,
        timezone: user.timezone,
        lang: newLang
      })
    },
    actionName: USER_LANG,
    dispatch
  })
}

export const putMyselfWorkspaceRead = workspaceId => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces/${workspaceId}/read`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: USER_KNOWN_MEMBER_LIST,
    dispatch
  })
}

export const putMyselfWorkspaceDoNotify = (workspaceId, doNotify) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces/${workspaceId}/notifications/${doNotify ? 'activate' : 'deactivate'}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: USER_WORKSPACE_DO_NOTIFY,
    dispatch
  })
}

export const putUserWorkspaceDoNotify = (user, workspaceId, doNotify) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.userId}/workspaces/${workspaceId}/notifications/${doNotify ? 'activate' : 'deactivate'}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: USER_WORKSPACE_DO_NOTIFY,
    dispatch
  })
}

export const getMyselfWorkspaceList = (showOwnedWorkspace) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces?show_owned_workspace=${showOwnedWorkspace ? 1 : 0}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_LIST,
    dispatch
  })
}

export const getWorkspaceDetail = (workspaceId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_DETAIL,
    dispatch
  })
}

export const getWorkspaceMemberList = (workspaceId, showDisabledUser = false) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/members${showDisabledUser ? '?show_disabled_user=1' : ''}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_MEMBER_LIST,
    dispatch
  })
}

export const getContent = (workspaceId, contentId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/contents/${contentId}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: CONTENT,
    dispatch
  })
}

export const getFolderContentList = (workspaceId, folderIdList) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/contents?parent_ids=${folderIdList.join(',')}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: FOLDER,
    dispatch
  })
}

export const getSubFolderShareContentList = (workspaceId, folderIdList) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/contents?namespaces_filter=upload&parent_ids=${folderIdList.join(',')}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE,
    dispatch
  })
}

export const getShareFolderContentList = (workspaceId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/contents?namespaces_filter=upload`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_CONTENT_SHARE_FOLDER,
    dispatch
  })
}

export const getContentPathList = (workspaceId, contentId, folderIdList) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/contents?complete_path_to_id=${contentId}&parent_ids=${folderIdList.join(',')}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_CONTENT_PATH,
    dispatch
  })
}

export const getMyselfWorkspaceRecentActivityList = (workspaceId, beforeId = null) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces/${workspaceId}/contents/recently_active?limit=10${beforeId ? `&before_content_id=${beforeId}` : ''}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_RECENT_ACTIVITY,
    dispatch
  })
}

export const getMyselfWorkspaceReadStatusList = workspaceId => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces/${workspaceId}/contents/read_status`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_READ_STATUS,
    dispatch
  })
}

export const postWorkspaceMember = (workspaceId, newMember) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/members`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'POST',
      body: JSON.stringify({
        user_id: newMember.id || null,
        user_email: newMember.email || null,
        user_username: newMember.username || null,
        role: newMember.role
      })
    },
    actionName: WORKSPACE_MEMBER_ADD,
    dispatch
  })
}

export const deleteWorkspaceMember = (workspaceId, memberId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/members/${memberId}`,
    param: {
      credentials: 'include',
      headers: { ...FETCH_CONFIG.headers },
      method: 'DELETE'
    },
    actionName: WORKSPACE_MEMBER_REMOVE,
    dispatch
  })
}

export const getFolderContent = (workspaceId, folderId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/contents?parent_id=${folderId}`,
    param: {
      credentials: 'include',
      headers: { ...FETCH_CONFIG.headers },
      method: 'GET'
    },
    actionName: `${WORKSPACE}/${FOLDER}`,
    dispatch
  })
}

export const getConfig = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/system/config`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: CONFIG,
    dispatch
  })
}

export const getAppList = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/system/applications`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: APP_LIST,
    dispatch
  })
}

export const getContentTypeList = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/system/content_types`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: CONTENT_TYPE_LIST,
    dispatch
  })
}

export const putWorkspaceContentArchived = (workspaceId, contentId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: WORKSPACE_CONTENT_ARCHIVED,
    dispatch
  })
}

export const putWorkspaceContentDeleted = (workspaceId, contentId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: WORKSPACE_CONTENT_DELETED,
    dispatch
  })
}

export const putFolderRead = (userId, workspaceId, contentId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/workspaces/${workspaceId}/contents/${contentId}/read`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: FOLDER_READ,
    dispatch
  })
}

export const getLoggedUserCalendar = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/agenda`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_AGENDA_URL,
    dispatch
  })
}

export const getUserCalendar = userId => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/agenda`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_AGENDA_URL,
    dispatch
  })
}

export const getSearchedKeywords = (contentTypes, searchedKeywords, pageNumber, pageSize, showArchived, showDeleted, showActive) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/search/content?show_archived=${showArchived ? 1 : 0}&content_types=${contentTypes}&show_deleted=${showDeleted ? 1 : 0}&show_active=${showActive ? 1 : 0}&search_string=${encodeURIComponent(searchedKeywords)}&page_nb=${pageNumber}&size=${pageSize}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: SEARCHED_KEYWORDS,
    dispatch
  })
}

export const putContentItemMove = (source, destination) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${source.workspaceId}/contents/${source.contentId}/move`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        new_workspace_id: destination.workspaceId || 0,
        new_parent_id: destination.contentId || 0
      })
    },
    actionName: WORKSPACE_CONTENT_MOVE,
    dispatch
  })
}

export const getFileInfos = (token) =>
  fetch(`${FETCH_CONFIG.apiUrl}/public/guest-download/${token}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postDownloadFile = (token, guestPassword) =>
  fetch(`${FETCH_CONFIG.apiUrl}/public/guest-download/${token}/check`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      password: guestPassword
    })
  })

export const getGuestUploadInfo = token => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/public/guest-upload/${token}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: 'GuestUpload',
    dispatch
  })
}

const defaultExcludedEventTypesParam = '&exclude_event_types=' + global.GLOBAL_excludedNotifications.join(',')

const activityExcludedEventTypesParam = '&exclude_event_types=' + global.GLOBAL_excludedNotifications.filter(
  ev => {
    const [entityType, eventType] = ev.split('.')
    return (entityType !== TLM_ENTITY_TYPE.CONTENT || eventType !== TLM_CORE_EVENT_TYPE.MODIFIED)
  }
).join(',')

export const getNotificationList = (
  userId,
  {
    excludeAuthorId = null,
    notificationsPerPage = NUMBER_RESULTS_BY_PAGE,
    nextPageToken = null,
    workspaceId = null,
    includeNotSent = false,
    activityFeedEvents = false,
    relatedContentId = null
  }) => async dispatch => {
  const queryParameterList = [
    activityFeedEvents
      ? activityExcludedEventTypesParam
      : defaultExcludedEventTypesParam
  ]
  if (excludeAuthorId) queryParameterList.push(`exclude_author_ids=${excludeAuthorId}`)
  if (notificationsPerPage > 0) queryParameterList.push(`count=${notificationsPerPage}`)
  if (nextPageToken) queryParameterList.push(`page_token=${nextPageToken}`)
  if (workspaceId) queryParameterList.push(`workspace_ids=${workspaceId}`)
  if (includeNotSent) queryParameterList.push('include_not_sent=1')
  if (relatedContentId) queryParameterList.push(`related_to_content_ids=${relatedContentId}`)
  const fetchGetNotificationWall = await fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/messages?${queryParameterList.join('&')}`,
    param: {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'GET'
    },
    actionName: NOTIFICATION_LIST,
    dispatch
  })

  if (fetchGetNotificationWall.status === 200) {
    fetchGetNotificationWall.json.items = fetchGetNotificationWall.json.items.map(notification => ({
      ...notification,
      fields: {
        ...notification.fields,
        author: updateTLMAuthor(notification.fields.author)
      }
    }))
  }
  return fetchGetNotificationWall
}

export const putNotificationAsRead = (userId, eventId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/messages/${eventId}/read`,
    param: {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'PUT'
    },
    actionName: NOTIFICATION,
    dispatch
  })
}

export const putAllNotificationAsRead = (userId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/messages/read`,
    param: {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'PUT'
    },
    actionName: NOTIFICATION_LIST,
    dispatch
  })
}

export const getUserMessagesSummary = userId => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/messages/summary?exclude_author_ids=${userId}${defaultExcludedEventTypesParam}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: NOTIFICATION_NOT_READ_COUNT,
    dispatch
  })
}

export const getAccessibleWorkspaces = userId => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/accessible_workspaces`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: ACCESSIBLE_WORKSPACE_LIST,
    dispatch
  })
}

export const getWorkspaceSubscriptions = userId => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/workspace_subscriptions`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_SUBSCRIPTION_LIST,
    dispatch
  })
}

export const postUserWorkspace = (workspaceId, userId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/workspaces`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId
      })
    },
    actionName: WORKSPACE_LIST,
    dispatch
  })
}

export const putUserWorkspaceSubscription = (workspaceId, userId) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/workspace_subscriptions`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        workspace_id: workspaceId
      })
    },
    actionName: WORKSPACE_SUBSCRIPTION_LIST,
    dispatch
  })
}

export const getHTMLPreview = (workspaceId, contentType, contentId, label) => {
  // RJ - NOTE - 17-11-2020 - this uses fetch instead of fetchWrapper due to the
  // specific error handling
  return fetch(`${FETCH_CONFIG.apiUrl}/workspaces/${workspaceId}/${contentType}s/${contentId}/preview/html/${encodeURIComponent(label)}.html`, {
    credentials: 'include',
    headers: FETCH_CONFIG.headers,
    method: 'GET'
  })
}

export const getCustomPropertiesSchema = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/system/user-custom-properties-schema`,
    param: {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'GET'
    },
    actionName: CUSTOM_PROPERTIES_SCHEMA,
    dispatch
  })
}

export const getCustomPropertiesUiSchema = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/system/user-custom-properties-ui-schema`,
    param: {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'GET'
    },
    actionName: CUSTOM_PROPERTIES_UI_SCHEMA,
    dispatch
  })
}

export const getUserCustomPropertiesDataSchema = userId => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/custom-properties`,
    param: {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'GET'
    },
    actionName: USER_PUBLIC_PROFILE,
    dispatch
  })
}

export const putUserCustomPropertiesDataSchema = (userId, formData) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${userId}/custom-properties`,
    param: {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'PUT',
      body: JSON.stringify({
        parameters: formData
      })
    },
    actionName: USER_PUBLIC_PROFILE,
    dispatch
  })
}
