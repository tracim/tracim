export const SET = 'Set'
export const UPDATE = 'Update'
export const ADD = 'Add'
export const REMOVE = 'Remove'
export const APPEND = 'Append'

export const TIMEZONE = 'Timezone'
export const setTimezone = timezone => ({ type: `${SET}/${TIMEZONE}`, timezone })

export const FLASH_MESSAGE = 'FlashMessage'
export const newFlashMessage = (msgText = '', msgType = 'info', msgDelay = 5000) => dispatch => {
  msgDelay !== 0 && window.setTimeout(() => dispatch(removeFlashMessage(msgText)), msgDelay)
  return dispatch(addFlashMessage({message: msgText, type: msgType}))
}
const addFlashMessage = msg => ({ type: `${ADD}/${FLASH_MESSAGE}`, msg }) // only newFlashMsg should be used by component and app so dont export this
export const removeFlashMessage = msg => ({ type: `${REMOVE}/${FLASH_MESSAGE}`, msg })

export const USER = 'User'
export const USER_LOGIN = `${USER}/Login`
export const USER_LOGOUT = `${USER}/Logout`
export const USER_CONNECTED = `${USER}/Connected`
export const USER_DISCONNECTED = `${USER}/Disconnected`
export const setUserConnected = user => ({ type: `${SET}/${USER}/Connected`, user })
export const setUserDisconnected = () => ({ type: `${SET}/${USER}/Disconnected` })
export const USER_DATA = `${USER}/Data`
export const updateUserData = userData => ({ type: `${UPDATE}/${USER}/Data`, data: userData })
export const USER_ROLE = `${USER}/Role`
export const setUserRole = userRole => ({ type: `${SET}/${USER}/Role`, userRole }) // this actually update workspaceList state
export const updateUserWorkspaceSubscriptionNotif = (workspaceId, subscriptionNotif) =>
  ({ type: `${UPDATE}/${USER_ROLE}/SubscriptionNotif`, workspaceId, subscriptionNotif })
export const USER_LANG = `${USER}/Lang`
export const setUserLang = lang => ({ type: `${SET}/${USER}/Lang`, lang })
export const USER_KNOWN_MEMBER = `${USER}/KnownMember`
export const USER_KNOWN_MEMBER_LIST = `${USER_KNOWN_MEMBER}/List`

export const WORKSPACE = 'Workspace'
export const WORKSPACE_CONTENT = `${WORKSPACE}/Content`
export const setWorkspaceContentList = workspaceContentList => ({ type: `${SET}/${WORKSPACE_CONTENT}`, workspaceContentList })
export const updateWorkspaceFilter = filterList => ({ type: `${UPDATE}/${WORKSPACE}/Filter`, filterList })

export const WORKSPACE_LIST = `${WORKSPACE}/List`
export const updateWorkspaceListData = workspaceList => ({ type: `${UPDATE}/${WORKSPACE_LIST}`, workspaceList })
export const setWorkspaceListIsOpenInSidebar = (workspaceId, isOpenInSidebar) => ({ type: `${SET}/${WORKSPACE_LIST}/isOpenInSidebar`, workspaceId, isOpenInSidebar })

export const WORKSPACE_DETAIL = `${WORKSPACE}/Detail`
export const setWorkspaceDetail = workspaceDetail => ({ type: `${SET}/${WORKSPACE_DETAIL}`, workspaceDetail })

export const WORKSPACE_MEMBER = `${WORKSPACE}/Member`
export const WORKSPACE_MEMBER_LIST = `${WORKSPACE_MEMBER}/List`
export const setWorkspaceMemberList = workspaceMemberList => ({ type: `${SET}/${WORKSPACE_MEMBER_LIST}`, workspaceMemberList })
export const WORKSPACE_MEMBER_ADD = `${WORKSPACE_MEMBER}/${ADD}`

export const WORKSPACE_RECENT_ACTIVITY = `${WORKSPACE}/RecentActivity/List`
export const WORKSPACE_RECENT_ACTIVITY_LIST = `${WORKSPACE_RECENT_ACTIVITY}/List`
export const setWorkspaceRecentActivityList = workspaceRecentActivityList => ({ type: `${SET}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, workspaceRecentActivityList })
export const appendWorkspaceRecentActivityList = workspaceRecentActivityList => ({ type: `${APPEND}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, workspaceRecentActivityList })

export const WORKSPACE_READ_STATUS = `${WORKSPACE}/ReadStatus`
export const WORKSPACE_READ_STATUS_LIST = `${WORKSPACE_READ_STATUS}/List`
export const setWorkspaceReadStatusList = workspaceReadStatusList => ({ type: `${SET}/${WORKSPACE_READ_STATUS_LIST}`, workspaceReadStatusList })

export const FOLDER = 'Folder'
export const setFolderData = (folderId, content) => ({ type: `${SET}/${WORKSPACE}/${FOLDER}/Content`, folderId, content })

export const APP = 'App'
export const APP_LIST = `${APP}/List`
export const setAppList = appList => ({ type: `${SET}/${APP_LIST}`, appList })

export const CONTENT_TYPE = 'ContentType'
export const CONTENT_TYPE_LIST = `${CONTENT_TYPE}/List`
export const setContentTypeList = contentTypeList => ({ type: `${SET}/${CONTENT_TYPE_LIST}`, contentTypeList })

export const LANG = 'Lang'
export const updateLangList = langList => ({ type: `${UPDATE}/${LANG}`, langList })
