export const SET = 'Set' // save data from api
export const UPDATE = 'Update' // edit data from api
export const TOGGLE = 'Toggle'
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
export const LOGIN = 'Login'
export const USER_LOGIN = `${USER}/${LOGIN}`
export const USER_LOGOUT = `${USER}/Logout`
export const USER_REQUEST_PASSWORD = `${USER}/RequestPassword`
export const USER_CONNECTED = `${USER}/Connected`
export const USER_DISCONNECTED = `${USER}/Disconnected`
export const setUserConnected = user => ({ type: `${SET}/${USER}/Connected`, user })
export const setUserDisconnected = () => ({ type: `${SET}/${USER}/Disconnected` })
export const setRedirectLogin = url => ({ type: `${SET}/${LOGIN}/Redirect`, url })

export const USER_LANG = `${USER}/Lang`
export const setUserLang = lang => ({ type: `${SET}/${USER}/Lang`, lang })
export const USER_KNOWN_MEMBER = `${USER}/KnownMember`
export const USER_KNOWN_MEMBER_LIST = `${USER_KNOWN_MEMBER}/List`

export const USER_NAME = `${USER}/PublicName`
export const updateUserName = newName => ({ type: `${UPDATE}/${USER_NAME}`, newName })
export const USER_EMAIL = `${USER}/Email`
export const updateUserEmail = newEmail => ({ type: `${UPDATE}/${USER_EMAIL}`, newEmail })
export const USER_PASSWORD = `${USER}/Password`

export const CONTENT = 'Content'
export const WORKSPACE = 'Workspace'
export const WORKSPACE_CONTENT = `${WORKSPACE}/${CONTENT}`
export const PATH = 'Path'
export const WORKSPACE_CONTENT_PATH = `${WORKSPACE_CONTENT}/${PATH}`
export const setWorkspaceContentList = (workspaceContentList, idFolderToOpenList) => ({ type: `${SET}/${WORKSPACE_CONTENT}`, workspaceContentList, idFolderToOpenList })
export const addWorkspaceContentList = workspaceContentList => ({ type: `${ADD}/${WORKSPACE_CONTENT}`, workspaceContentList })
export const updateWorkspaceFilter = filterList => ({ type: `${UPDATE}/${WORKSPACE}/Filter`, filterList })

export const USER_WORKSPACE_DO_NOTIFY = `${USER}/${WORKSPACE}/SubscriptionNotif`
export const updateUserWorkspaceSubscriptionNotif = (idUser, idWorkspace, doNotify) =>
  ({ type: `${UPDATE}/${USER_WORKSPACE_DO_NOTIFY}`, idUser, idWorkspace, doNotify })

export const WORKSPACE_CONTENT_ARCHIVED = `${WORKSPACE_CONTENT}/Archived`
export const WORKSPACE_CONTENT_DELETED = `${WORKSPACE_CONTENT}/Deleted`
export const setWorkspaceContentArchived = (idWorkspace, idContent) => ({ type: `${SET}/${WORKSPACE_CONTENT_ARCHIVED}`, idWorkspace, idContent })
export const setWorkspaceContentDeleted = (idWorkspace, idContent) => ({ type: `${SET}/${WORKSPACE_CONTENT_DELETED}`, idWorkspace, idContent })

export const WORKSPACE_LIST = `${WORKSPACE}/List`
export const setWorkspaceList = workspaceList => ({ type: `${SET}/${WORKSPACE_LIST}`, workspaceList })
export const setWorkspaceListIsOpenInSidebar = (workspaceId, isOpenInSidebar) => ({ type: `${SET}/${WORKSPACE_LIST}/isOpenInSidebar`, workspaceId, isOpenInSidebar })

export const USER_WORKSPACE_LIST = `${USER}/${WORKSPACE_LIST}`

export const WORKSPACE_LIST_MEMBER = `${WORKSPACE_LIST}/Member/List`
export const setWorkspaceListMemberList = workspaceListMemberList => ({ type: `${SET}/${WORKSPACE_LIST_MEMBER}`, workspaceListMemberList })

// workspace related const bellow is for currentWorkspace
export const WORKSPACE_DETAIL = `${WORKSPACE}/Detail`
export const setWorkspaceDetail = workspaceDetail => ({ type: `${SET}/${WORKSPACE_DETAIL}`, workspaceDetail })

export const WORKSPACE_MEMBER = `${WORKSPACE}/Member`
export const WORKSPACE_MEMBER_LIST = `${WORKSPACE_MEMBER}/List`
export const setWorkspaceMemberList = workspaceMemberList => ({ type: `${SET}/${WORKSPACE_MEMBER_LIST}`, workspaceMemberList })
export const WORKSPACE_MEMBER_ADD = `${WORKSPACE_MEMBER}/${ADD}`
export const WORKSPACE_MEMBER_REMOVE = `${WORKSPACE_MEMBER}/${REMOVE}`
export const removeWorkspaceMember = idMember => ({ type: `${REMOVE}/${WORKSPACE_MEMBER}`, idMember })

export const WORKSPACE_RECENT_ACTIVITY = `${WORKSPACE}/RecentActivity/List`
export const WORKSPACE_RECENT_ACTIVITY_LIST = `${WORKSPACE_RECENT_ACTIVITY}/List`
export const setWorkspaceRecentActivityList = workspaceRecentActivityList => ({ type: `${SET}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, workspaceRecentActivityList })
export const appendWorkspaceRecentActivityList = workspaceRecentActivityList => ({ type: `${APPEND}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, workspaceRecentActivityList })

export const WORKSPACE_READ_STATUS = `${WORKSPACE}/ReadStatus`
export const WORKSPACE_READ_STATUS_LIST = `${WORKSPACE_READ_STATUS}/List`
export const setWorkspaceReadStatusList = workspaceReadStatusList => ({ type: `${SET}/${WORKSPACE_READ_STATUS_LIST}`, workspaceReadStatusList })

export const FOLDER = 'Folder'
export const READ = 'Read'
export const toggleFolderOpen = idFolder => ({ type: `${TOGGLE}/${WORKSPACE}/${FOLDER}`, idFolder })
export const FOLDER_READ = `${FOLDER}/${READ}`
export const setWorkspaceContentRead = idFolder => ({ type: `${SET}/${FOLDER_READ}`, idFolder })

export const APP = 'App'
export const APP_LIST = `${APP}/List`
export const setAppList = appList => ({ type: `${SET}/${APP_LIST}`, appList })

export const CONTENT_TYPE = 'ContentType'
export const CONTENT_TYPE_LIST = `${CONTENT_TYPE}/List`
export const setContentTypeList = contentTypeList => ({ type: `${SET}/${CONTENT_TYPE_LIST}`, contentTypeList })

export const CONFIG = 'Config'
export const setConfig = config => ({ type: `${SET}/${CONFIG}`, config })

export const LANG = 'Lang'
export const updateLangList = langList => ({ type: `${UPDATE}/${LANG}`, langList })
