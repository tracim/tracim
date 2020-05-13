export const SET = 'Set' // save data from api
export const UPDATE = 'Update' // edit data from api
export const TOGGLE = 'Toggle'
export const ADD = 'Add'
export const REMOVE = 'Remove'
export const PREPEND = 'Prepend'
export const APPEND = 'Append'
export const RESET = 'Reset'
export const MOVE = 'Move'

export const TIMEZONE = 'Timezone'
export const setTimezone = timezone => ({ type: `${SET}/${TIMEZONE}`, timezone })

export const FLASH_MESSAGE = 'FlashMessage'
export const newFlashMessage = (msgText = '', msgType = 'info', msgDelay = 5000) => dispatch => {
  if (msgDelay !== 0) window.setTimeout(() => dispatch(removeFlashMessage(msgText)), msgDelay)
  return dispatch(addFlashMessage({ message: msgText, type: msgType }))
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
export const setUserConnected = user => ({ type: `${SET}/${USER_CONNECTED}`, user })
export const setUserDisconnected = () => ({ type: `${SET}/${USER_DISCONNECTED}` })
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
export const updateUserAgendaUrl = newAgendaUrl => ({ type: `${SET}/${USER_AGENDA_URL}`, newAgendaUrl })
export const USER_AGENDA_URL = `${USER}/Agenda`

export const CONTENT = 'Content'
export const WORKSPACE = 'Workspace'
export const WORKSPACE_CONTENT = `${WORKSPACE}/${CONTENT}`
export const SHARE_FOLDER = 'SHARE_FOLDER'
export const WORKSPACE_CONTENT_SHARE_FOLDER = `${WORKSPACE_CONTENT}/${SHARE_FOLDER}`
export const PATH = 'Path'
export const WORKSPACE_CONTENT_PATH = `${WORKSPACE_CONTENT}/${PATH}`
export const setWorkspaceContentList = (workspaceContentList, folderIdToOpenList) => ({ type: `${SET}/${WORKSPACE_CONTENT}`, workspaceContentList, folderIdToOpenList })
export const setWorkspaceShareFolderContentList = (workspaceShareFolderContentList, folderIdToOpenList) => ({ type: `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, workspaceShareFolderContentList, folderIdToOpenList })
export const addWorkspaceContentList = workspaceContentList => ({ type: `${ADD}/${WORKSPACE_CONTENT}`, workspaceContentList })
export const addWorkspaceShareFolderContentList = workspaceShareFolderContentList => ({ type: `${ADD}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, workspaceShareFolderContentList })
export const updateWorkspaceFilter = filterList => ({ type: `${UPDATE}/${WORKSPACE}/Filter`, filterList })

export const USER_WORKSPACE_DO_NOTIFY = `${USER}/${WORKSPACE}/SubscriptionNotif`
export const updateUserWorkspaceSubscriptionNotif = (userId, workspaceId, doNotify) =>
  ({ type: `${UPDATE}/${USER_WORKSPACE_DO_NOTIFY}`, userId, workspaceId, doNotify })

export const WORKSPACE_CONTENT_ARCHIVED = `${WORKSPACE_CONTENT}/Archived`
export const WORKSPACE_CONTENT_DELETED = `${WORKSPACE_CONTENT}/Deleted`
export const setWorkspaceContentArchived = (workspaceId, contentId) => ({ type: `${SET}/${WORKSPACE_CONTENT_ARCHIVED}`, workspaceId, contentId })
export const setWorkspaceContentDeleted = (workspaceId, contentId) => ({ type: `${SET}/${WORKSPACE_CONTENT_DELETED}`, workspaceId, contentId })
export const WORKSPACE_CONTENT_SHARE_FOLDER_ARCHIVED = `${WORKSPACE_CONTENT_SHARE_FOLDER}/Archived`
export const WORKSPACE_CONTENT_SHARE_FOLDER_DELETED = `${WORKSPACE_CONTENT_SHARE_FOLDER}/Deleted`
export const setWorkspaceContentShareFolderArchived = (workspaceId, contentId) => ({ type: `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER_ARCHIVED}`, workspaceId, contentId })
export const setWorkspaceContentShareFolderDeleted = (workspaceId, contentId) => ({ type: `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER_DELETED}`, workspaceId, contentId })

export const WORKSPACE_CONTENT_MOVE = `${MOVE}/${WORKSPACE_CONTENT}`
export const moveWorkspaceContent = (source, destination) => ({ type: `${MOVE}/${WORKSPACE_CONTENT}`, source, destination })

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
export const removeWorkspaceMember = memberId => ({ type: `${REMOVE}/${WORKSPACE_MEMBER}`, memberId })
export const addWorkspaceMember = member => ({ type: `${ADD}/${WORKSPACE_MEMBER}`, member })

export const WORKSPACE_RECENT_ACTIVITY = `${WORKSPACE}/RecentActivity/List`
export const WORKSPACE_RECENT_ACTIVITY_LIST = `${WORKSPACE_RECENT_ACTIVITY}/List`
export const setWorkspaceRecentActivityList = workspaceRecentActivityList => ({ type: `${SET}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, workspaceRecentActivityList })
export const appendWorkspaceRecentActivityList = workspaceRecentActivityList => ({ type: `${APPEND}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, workspaceRecentActivityList })

export const WORKSPACE_READ_STATUS = `${WORKSPACE}/ReadStatus`
export const WORKSPACE_READ_STATUS_LIST = `${WORKSPACE_READ_STATUS}/List`
export const setWorkspaceReadStatusList = workspaceReadStatusList => ({ type: `${SET}/${WORKSPACE_READ_STATUS_LIST}`, workspaceReadStatusList })

export const WORKSPACE_AGENDA_URL = `${WORKSPACE}/AgendaUrl`
export const setWorkspaceAgendaUrl = agendaUrl => ({ type: `${SET}/${WORKSPACE_AGENDA_URL}`, agendaUrl })

export const FOLDER = 'Folder'
export const READ = 'Read'
export const toggleFolderOpen = folderId => ({ type: `${TOGGLE}/${WORKSPACE}/${FOLDER}`, folderId })
export const FOLDER_READ = `${FOLDER}/${READ}`
export const setWorkspaceContentRead = folderId => ({ type: `${SET}/${FOLDER_READ}`, folderId })

export const APP = 'App'
export const APP_FEATURE = `${APP}Feature`
export const APP_LIST = `${APP}/List`
export const setAppList = appList => ({ type: `${SET}/${APP_LIST}`, appList })

export const CONTENT_TYPE = 'ContentType'
export const CONTENT_TYPE_LIST = `${CONTENT_TYPE}/List`
export const setContentTypeList = contentTypeList => ({ type: `${SET}/${CONTENT_TYPE_LIST}`, contentTypeList })

export const CONFIG = 'Config'
export const setConfig = config => ({ type: `${SET}/${CONFIG}`, config })

export const LANG = 'Lang'
export const updateLangList = langList => ({ type: `${UPDATE}/${LANG}`, langList })

export const BREADCRUMBS = 'Breadcrumbs'
export const setBreadcrumbs = newBreadcrumbs => ({ type: `${SET}/${BREADCRUMBS}`, newBreadcrumbs })
export const resetBreadcrumbs = () => ({ type: `${RESET}/${BREADCRUMBS}` })
export const prependBreadcrumbs = prependBreadcrumbs => ({ type: `${PREPEND}/${BREADCRUMBS}`, prependBreadcrumbs })
export const appendBreadcrumbs = appendBreadcrumbs => ({ type: `${APPEND}/${BREADCRUMBS}`, appendBreadcrumbs })
export const resetBreadcrumbsAppFeature = () => ({ type: `${RESET}/${BREADCRUMBS}/${APP_FEATURE}` })

export const SEARCH_RESULTS_LIST = 'SearchResultsList'
export const setSearchResultsList = newSearchResultsList => ({ type: `${SET}/${SEARCH_RESULTS_LIST}`, newSearchResultsList })
export const appendSearchResultsList = appendSearchResultsList => ({ type: `${APPEND}/${SEARCH_RESULTS_LIST}`, appendSearchResultsList })
export const SEARCHED_KEYWORDS = 'SearchedKeywords'
export const setSearchedKeywords = searchedKeywords => ({ type: `${SET}/${SEARCHED_KEYWORDS}`, searchedKeywords })
export const SEARCH_RESULTS_BY_PAGE = 'SearchResultsByPage'
export const setNumberResultsByPage = numberResultsByPage => ({ type: `${SET}/${SEARCH_RESULTS_BY_PAGE}`, numberResultsByPage })
export const SEARCH_CURRENT_PAGE = 'SearchCurrentPage'
export const setCurrentNumberPage = currentNumberPage => ({ type: `${SET}/${SEARCH_CURRENT_PAGE}`, currentNumberPage })
