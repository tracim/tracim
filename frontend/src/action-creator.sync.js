export const SET = 'Set' // save data from api
export const UPDATE = 'Update' // edit data from api
export const TOGGLE = 'Toggle'
export const ADD = 'Add'
export const REMOVE = 'Remove'
export const RESTORE = 'Restore'
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
export const USER_CONFIGURATION = `${USER}/Configuration`
export const setUserConfiguration = userConfig => ({ type: `${SET}/${USER_CONFIGURATION}`, userConfig })
export const setUserConnected = user => ({ type: `${SET}/${USER_CONNECTED}`, user })
export const setUserDisconnected = () => ({ type: `${SET}/${USER_DISCONNECTED}` })
export const setRedirectLogin = url => ({ type: `${SET}/${LOGIN}/Redirect`, url })

export const USER_LANG = `${USER}/Lang`
export const setUserLang = lang => ({ type: `${SET}/${USER}/Lang`, lang })
export const USER_KNOWN_MEMBER = `${USER}/KnownMember`
export const USER_KNOWN_MEMBER_LIST = `${USER_KNOWN_MEMBER}/List`

export const updateUser = newUser => ({ type: `${UPDATE}/${USER}`, newUser })
export const USER_PUBLIC_NAME = `${USER}/PublicName`
export const USER_USERNAME = `${USER}/Username`
export const USER_EMAIL = `${USER}/Email`
export const USER_PASSWORD = `${USER}/Password`
export const USER_AGENDA_URL = `${USER}/Agenda`
export const updateUserAgendaUrl = newAgendaUrl => ({ type: `${SET}/${USER_AGENDA_URL}`, newAgendaUrl })

export const CONTENT = 'Content'
export const WORKSPACE = 'Workspace'
export const WORKSPACE_CONTENT = `${WORKSPACE}/${CONTENT}`
export const SHARE_FOLDER = 'SHARE_FOLDER'
export const WORKSPACE_CONTENT_SHARE_FOLDER = `${WORKSPACE_CONTENT}/${SHARE_FOLDER}`
export const PATH = 'Path'
export const WORKSPACE_CONTENT_PATH = `${WORKSPACE_CONTENT}/${PATH}`
export const setWorkspaceContentList = (workspaceContentList, folderIdToOpenList, workspaceId) => ({ type: `${SET}/${WORKSPACE_CONTENT}`, workspaceContentList, folderIdToOpenList, workspaceId })
export const setWorkspaceShareFolderContentList = (workspaceShareFolderContentList, folderIdToOpenList, workspaceId) => ({ type: `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, workspaceShareFolderContentList, folderIdToOpenList, workspaceId })

export const addWorkspaceContentList = (workspaceContentList, workspaceId) => ({ type: `${ADD}/${WORKSPACE_CONTENT}`, workspaceContentList, workspaceId })
export const updateWorkspaceContentList = (workspaceContentList, workspaceId) => ({ type: `${UPDATE}/${WORKSPACE_CONTENT}`, workspaceContentList, workspaceId })
export const deleteWorkspaceContentList = (workspaceContentList, workspaceId) => ({ type: `${REMOVE}/${WORKSPACE_CONTENT}`, workspaceContentList, workspaceId })
export const unDeleteWorkspaceContentList = (workspaceContentList, workspaceId) => ({ type: `${RESTORE}/${WORKSPACE_CONTENT}`, workspaceContentList, workspaceId })

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
export const addWorkspaceList = workspaceList => ({ type: `${ADD}/${WORKSPACE_LIST}`, workspaceList })
export const removeWorkspace = workspace => ({ type: `${REMOVE}/${WORKSPACE_LIST}`, workspace })

export const USER_WORKSPACE_LIST = `${USER}/${WORKSPACE_LIST}`

export const WORKSPACE_LIST_MEMBER = `${WORKSPACE_LIST}/Member/List`
export const setWorkspaceListMemberList = workspaceListMemberList => ({ type: `${SET}/${WORKSPACE_LIST_MEMBER}`, workspaceListMemberList })

// workspace related const bellow is for currentWorkspace
export const WORKSPACE_DETAIL = `${WORKSPACE}/Detail`
export const setWorkspaceDetail = workspaceDetail => ({ type: `${SET}/${WORKSPACE_DETAIL}`, workspaceDetail })
export const updateWorkspaceDetail = workspaceDetail => ({ type: `${UPDATE}/${WORKSPACE_DETAIL}`, workspaceDetail })

export const WORKSPACE_MEMBER = `${WORKSPACE}/Member`
export const WORKSPACE_MEMBER_LIST = `${WORKSPACE_MEMBER}/List`
export const setWorkspaceMemberList = workspaceMemberList => ({ type: `${SET}/${WORKSPACE_MEMBER_LIST}`, workspaceMemberList })
export const WORKSPACE_MEMBER_ADD = `${WORKSPACE_MEMBER}/${ADD}`
export const WORKSPACE_MEMBER_REMOVE = `${WORKSPACE_MEMBER}/${REMOVE}`
export const addWorkspaceMember = (user, workspaceId, member) => ({
  type: `${ADD}/${WORKSPACE_MEMBER}`,
  newMember: { user: user, ...member },
  workspaceId
})
export const updateWorkspaceMember = (user, workspaceId, member) => ({
  type: `${UPDATE}/${WORKSPACE_MEMBER}`,
  member: { user: user, ...member },
  workspaceId
})
export const removeWorkspaceMember = (memberId, workspaceId) => ({ type: `${REMOVE}/${WORKSPACE_MEMBER}`, memberId, workspaceId })

export const WORKSPACE_RECENT_ACTIVITY = `${WORKSPACE}/RecentActivity/List`
export const WORKSPACE_RECENT_ACTIVITY_LIST = `${WORKSPACE_RECENT_ACTIVITY}/List`
export const setWorkspaceRecentActivityList = workspaceRecentActivityList => ({ type: `${SET}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, workspaceRecentActivityList })
export const appendWorkspaceRecentActivityList = workspaceRecentActivityList => ({ type: `${APPEND}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, workspaceRecentActivityList })

export const WORKSPACE_READ_STATUS = `${WORKSPACE}/ReadStatus`
export const WORKSPACE_READ_STATUS_LIST = `${WORKSPACE_READ_STATUS}/List`
export const setWorkspaceReadStatusList = workspaceReadStatusList => ({ type: `${SET}/${WORKSPACE_READ_STATUS_LIST}`, workspaceReadStatusList })
export const addWorkspaceReadStatus = (content, workspaceId) => ({ type: `${ADD}/${WORKSPACE_READ_STATUS_LIST}`, content, workspaceId })
export const removeWorkspaceReadStatus = (unreadContent, workspaceId) => ({ type: `${REMOVE}/${WORKSPACE_READ_STATUS}`, unreadContent, workspaceId })

export const WORKSPACE_AGENDA_URL = `${WORKSPACE}/AgendaUrl`
export const setWorkspaceAgendaUrl = agendaUrl => ({ type: `${SET}/${WORKSPACE_AGENDA_URL}`, agendaUrl })

export const FOLDER = 'Folder'
export const READ = 'Read'
export const toggleFolderOpen = (folderId, workspaceId) => ({ type: `${TOGGLE}/${WORKSPACE}/${FOLDER}`, folderId, workspaceId })
export const FOLDER_READ = `${FOLDER}/${READ}`
export const setWorkspaceContentRead = folderId => ({ type: `${SET}/${FOLDER_READ}`, folderId })
export const setWorkspaceFolderContentList = (workspaceId, folderId, contentList) =>
  ({ type: `${SET}/${WORKSPACE}/${FOLDER}/${CONTENT}`, workspaceId, folderId, contentList })

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

export const HEAD_TITLE = 'HeadTitle'
export const setHeadTitle = headTitle => ({ type: `${SET}/${HEAD_TITLE}`, headTitle })

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

export const NEXT_PAGE = 'NextPage'
export const NOTIFICATION_LIST = 'NotificationList'
export const NOTIFICATION = 'Notification'
export const NOTIFICATION_NOT_READ_COUNT = 'NotificationNotReadCounter'
export const setNotificationList = notificationList => ({ type: `${SET}/${NOTIFICATION_LIST}`, notificationList })
export const appendNotificationList = notificationList => ({ type: `${APPEND}/${NOTIFICATION_LIST}`, notificationList })
export const addNotification = notification => ({ type: `${ADD}/${NOTIFICATION}`, notification })
export const readNotification = notificationId => ({ type: `${READ}/${NOTIFICATION}`, notificationId })
export const readNotificationList = () => ({ type: `${READ}/${NOTIFICATION_LIST}` })
export const setNextPage = (hasNextPage, nextPageToken) => ({ type: `${SET}/${NEXT_PAGE}`, hasNextPage, nextPageToken })
export const setNotificationNotReadCounter = (notificationNotReadCount) => ({ type: `${SET}/${NOTIFICATION_NOT_READ_COUNT}`, notificationNotReadCount })

export const ACCESSIBLE_WORKSPACE_LIST = `${WORKSPACE}/AccessibleList`
export const ACCESSIBLE_WORKSPACE = `${WORKSPACE}/Accessible`
export const setAccessibleWorkspaceList = workspaceList => ({ type: `${SET}/${ACCESSIBLE_WORKSPACE_LIST}`, workspaceList })
export const addAccessibleWorkspace = workspace => ({ type: `${ADD}/${ACCESSIBLE_WORKSPACE}`, workspace })
export const removeAccessibleWorkspace = workspace => ({ type: `${REMOVE}/${ACCESSIBLE_WORKSPACE}`, workspace })
export const updateAccessibleWorkspace = workspace => ({ type: `${UPDATE}/${ACCESSIBLE_WORKSPACE}`, workspace })
export const WORKSPACE_SUBSCRIPTION_LIST = `${WORKSPACE}/SubscriptionList`
export const WORKSPACE_SUBSCRIPTION = `${WORKSPACE}/Subscription`
export const setWorkspaceSubscriptionList = subscriptionList => ({ type: `${SET}/${WORKSPACE_SUBSCRIPTION_LIST}`, subscriptionList })
export const addWorkspaceSubscription = subscription => ({ type: `${ADD}/${WORKSPACE_SUBSCRIPTION}`, subscription })
export const removeWorkspaceSubscription = subscription => ({ type: `${REMOVE}/${WORKSPACE_SUBSCRIPTION}`, subscription })
export const updateWorkspaceSubscription = subscription => ({ type: `${UPDATE}/${WORKSPACE_SUBSCRIPTION}`, subscription })

export const WORKSPACE_ACTIVITY = `${WORKSPACE}/Activity`
export const LIST = 'List'
export const setWorkspaceActivityList = activityList => ({ type: `${SET}/${WORKSPACE_ACTIVITY}/${LIST}`, activityList })
export const setWorkspaceActivityNextPage = (hasNextPage, nextPageToken) => ({ type: `${SET}/${WORKSPACE_ACTIVITY}/${NEXT_PAGE}`, hasNextPage, nextPageToken })
