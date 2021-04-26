import i18n from 'i18next'
import {
  serialize,
  NUMBER_RESULTS_BY_PAGE
} from 'tracim_frontend_lib'

import * as Cookies from 'js-cookie'

import { serializeUserProps } from '../reducer/user.js'

import {
  setConfig,
  newFlashMessage,
  setUserConfiguration,
  setWorkspaceList,
  setNotificationList,
  setAppList,
  setNextPage,
  setNotificationNotReadCounter,
  setWorkspaceListMemberList,
  setContentTypeList,
  setUserConnected,
  setAccessibleWorkspaceList
} from '../action-creator.sync.js'

import {
  getConfig,
  getAppList,
  getContentTypeList,
  getUserConfiguration,
  getMyselfWorkspaceList,
  getWorkspaceMemberList,
  getNotificationList,
  getUserMessagesSummary,
  getAccessibleWorkspaces,
  putUserLang
} from '../action-creator.async.js'

import { COOKIE_FRONTEND } from '../util/helper.js'

export const loadUserConfiguration = async (userId, dispatch) => {
  const fetchGetUserConfig = await dispatch(getUserConfiguration(userId))
  switch (fetchGetUserConfig.status) {
    case 200: dispatch(setUserConfiguration(fetchGetUserConfig.json.parameters)); break
    default: dispatch(newFlashMessage(i18n.t('Error while loading the user configuration')))
  }
}

export const loadWorkspaceLists = async (user, dispatch) => {
  const showOwnedWorkspace = false

  const fetchGetWorkspaceList = await dispatch(getMyselfWorkspaceList(showOwnedWorkspace))

  if (fetchGetWorkspaceList.status === 200) {
    dispatch(setWorkspaceList(fetchGetWorkspaceList.json))
    loadWorkspaceListMemberList(fetchGetWorkspaceList.json, dispatch)
  }

  const fetchAccessibleWorkspaceList = await dispatch(getAccessibleWorkspaces(user.userId))

  if (fetchAccessibleWorkspaceList.status !== 200) return false

  dispatch(setAccessibleWorkspaceList(fetchAccessibleWorkspaceList.json))

  return true
}

export const loadWorkspaceListMemberList = async (workspaceList, dispatch) => {
  const fetchWorkspaceListMemberList = await Promise.all(
    workspaceList.map(async ws => ({
      workspaceId: ws.workspace_id,
      fetchMemberList: await dispatch(getWorkspaceMemberList(ws.workspace_id))
    }))
  )

  const workspaceListMemberList = fetchWorkspaceListMemberList.map(memberList => ({
    workspaceId: memberList.workspaceId,
    memberList: memberList.fetchMemberList.status === 200 ? memberList.fetchMemberList.json : []
  }))

  dispatch(setWorkspaceListMemberList(workspaceListMemberList))
}

export const loadNotificationNotRead = async (userId, dispatch) => {
  const fetchNotificationNotRead = await dispatch(getUserMessagesSummary(userId))

  switch (fetchNotificationNotRead.status) {
    case 200: dispatch(setNotificationNotReadCounter(fetchNotificationNotRead.json.unread_messages_count)); break
    default: dispatch(newFlashMessage(i18n.t('Error loading unread notification number')))
  }
}

export const loadNotificationList = async (userId, dispatch) => {
  const fetchGetNotificationWall = await dispatch(getNotificationList(
    userId,
    {
      excludeAuthorId: userId,
      notificationsPerPage: NUMBER_RESULTS_BY_PAGE
    }
  ))

  switch (fetchGetNotificationWall.status) {
    case 200:
      dispatch(setNotificationList(fetchGetNotificationWall.json.items))
      dispatch(setNextPage(fetchGetNotificationWall.json.has_next, fetchGetNotificationWall.json.next_page_token))
      break
    default:
      dispatch(newFlashMessage(i18n.t('Error while loading the notification list'), 'warning'))
      break
  }
}

export const setDefaultUserLang = async (user, loggedUser, dispatch) => {
  const fetchPutUserLang = await dispatch(putUserLang(serialize(loggedUser, serializeUserProps), user.lang))
  switch (fetchPutUserLang.status) {
    case 200: break
    default: dispatch(newFlashMessage(i18n.t('Error while saving your language')))
  }
}

export const setUserLang = (fetchUser, user, dispatch) => {
  if (fetchUser.lang === null) setDefaultUserLang(user, fetchUser, dispatch)

  Cookies.set(COOKIE_FRONTEND.LAST_CONNECTION, '1', { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
  Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, fetchUser.lang, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })

  i18n.changeLanguage(fetchUser.lang)
}

const loadAppList = async (dispatch) => {
  const fetchGetAppList = await dispatch(getAppList())
  // FIXME - GB - 2019-07-23 - Hack to add the share folder app at appList while he still doesn't exist in backend
  if (fetchGetAppList.status === 200) {
    fetchGetAppList.json.push(
      {
        hexcolor: '#414548',
        slug: 'contents/share_folder',
        config: {},
        fa_icon: 'share-alt',
        is_active: true,
        label: 'Share Folder'
      }
    )

    dispatch(setAppList(fetchGetAppList.json))
  }
}

const loadContentTypeList = async (dispatch) => {
  const fetchGetContentTypeList = await dispatch(getContentTypeList())
  if (fetchGetContentTypeList.status === 200) dispatch(setContentTypeList(fetchGetContentTypeList.json))
}

export const connectUser = (fetchUser, user, dispatch) => {
  const loggedUser = {
    ...fetchUser,
    logged: true
  }

  setUserLang(fetchUser, user, dispatch)
  dispatch(setUserConnected(loggedUser))

  const userId = fetchUser.user_id
  loadWorkspaceLists(user, dispatch)
  loadNotificationNotRead(userId, dispatch)
  loadNotificationList(userId, dispatch)
  loadUserConfiguration(userId, dispatch)

  loadAppList(dispatch)
  loadContentTypeList(dispatch)
}

export const loadConfig = async (dispatch) => {
  const fetchGetConfig = await dispatch(getConfig())
  if (fetchGetConfig.status === 200) {
    dispatch(setConfig(fetchGetConfig.json))
  }
}
