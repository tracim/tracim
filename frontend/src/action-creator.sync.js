export const SET = 'Set'
export const UPDATE = 'Update'
export const ADD = 'Add'
export const REMOVE = 'Remove'

export const TIMEZONE = 'Timezone'
export const setTimezone = timezone => ({ type: `${SET}/${TIMEZONE}`, timezone })

export const FLASH_MESSAGE = 'FlashMessage'
export const newFlashMessage = (msgText = '', msgType = 'info', msgDelay = 5000) => dispatch => {
  msgDelay !== 0 && window.setTimeout(() => dispatch(removeFlashMessage(msgText)), msgDelay)
  return dispatch(addFlashMessage({message: msgText, type: msgType}))
}
export const addFlashMessage = msg => ({ type: `${ADD}/${FLASH_MESSAGE}`, msg })
export const removeFlashMessage = msg => ({ type: `${REMOVE}/${FLASH_MESSAGE}`, msg })

export const USER = 'User'
export const USER_LOGIN = 'User/Login'
export const USER_LOGOUT = 'User/Logout'
export const USER_DATA = 'User/Data'
export const USER_ROLE = 'User/Role'
export const USER_CONNECTED = 'User/Connected'
export const USER_DISCONNECTED = 'User/Disconnected'
export const USER_LANG = 'User/Lang'
export const setUserConnected = user => ({ type: `${SET}/${USER}/Connected`, user })
export const setUserDisconnected = () => ({ type: `${SET}/${USER}/Disconnected` })
export const updateUserData = userData => ({ type: `${UPDATE}/${USER}/Data`, data: userData })
export const setUserRole = userRole => ({ type: `${SET}/${USER}/Role`, userRole }) // this actually update workspaceList state
export const setUserLang = lang => ({ type: `${SET}/${USER}/Lang`, lang })
export const updateUserWorkspaceSubscriptionNotif = (workspaceId, subscriptionNotif) =>
  ({ type: `${UPDATE}/${USER_ROLE}/SubscriptionNotif`, workspaceId, subscriptionNotif })

export const WORKSPACE = 'Workspace'
export const setWorkspaceContent = (workspaceContent, filterStr = '') => ({ type: `${SET}/${WORKSPACE}/Content`, workspaceContent, filterStr })
export const updateWorkspaceFilter = filterList => ({ type: `${UPDATE}/${WORKSPACE}/Filter`, filterList })

export const FOLDER = 'Folder'
export const setFolderData = (folderId, content) => ({ type: `${SET}/${WORKSPACE}/${FOLDER}/Content`, folderId, content })

export const WORKSPACE_LIST = 'WorkspaceList'
export const updateWorkspaceListData = workspaceList => ({ type: `${UPDATE}/${WORKSPACE_LIST}`, workspaceList })
export const setWorkspaceListIsOpenInSidebar = (workspaceId, isOpenInSidebar) => ({ type: `${SET}/${WORKSPACE_LIST}/isOpenInSidebar`, workspaceId, isOpenInSidebar })

export const APP_LIST = 'App/List'
export const setAppList = appList => ({ type: `${SET}/${APP_LIST}`, appList })

export const CONTENT_TYPE_LIST = 'ContentType/List'
export const setContentTypeList = contentTypeList => ({ type: `${SET}/${CONTENT_TYPE_LIST}`, contentTypeList })

export const LANG = 'Lang'
export const updateLangList = langList => ({ type: `${UPDATE}/${LANG}`, langList })
