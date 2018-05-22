export const TIMEZONE = 'Timezone'
export const setTimezone = timezone => ({ type: `Set/${TIMEZONE}`, timezone })

export const FLASH_MESSAGE = 'FlashMessage'
export const newFlashMessage = (msgText = '', msgType = 'info', msgDelay = 5000) => dispatch => {
  msgDelay !== 0 && window.setTimeout(() => dispatch(removeFlashMessage(msgText)), msgDelay)
  return dispatch(addFlashMessage({message: msgText, type: msgType}))
}
export const addFlashMessage = msg => ({ type: `Add/${FLASH_MESSAGE}`, msg })
export const removeFlashMessage = msg => ({ type: `Remove/${FLASH_MESSAGE}`, msg })

export const USER_LOGIN = 'User/Login'
export const USER_LOGOUT = 'User/Logout'
export const USER_DATA = 'User/Data'
export const USER_ROLE = 'User/Role'
export const USER_CONNECTED = 'User/Connected'
export const USER_DISCONNECTED = 'User/Disconnected'
export const setUserConnected = user => ({ type: `Set/${USER_CONNECTED}`, user })
export const setUserDisconnected = () => ({ type: `Set/${USER_DISCONNECTED}` })
export const updateUserData = userData => ({ type: `Update/${USER_DATA}`, data: userData })
export const setUserRole = userRole => ({ type: `Set/${USER_ROLE}`, userRole }) // this actually update workspaceList state
export const updateUserWorkspaceSubscriptionNotif = (workspaceId, subscriptionNotif) =>
  ({ type: `Update/${USER_ROLE}/SubscriptionNotif`, workspaceId, subscriptionNotif })

export const WORKSPACE = 'Workspace'
export const setWorkspaceData = (workspace, filterStr = '') => ({ type: `Set/${WORKSPACE}`, workspace, filterStr })
export const updateWorkspaceFilter = filterList => ({ type: `Update/${WORKSPACE}/Filter`, filterList })

export const FOLDER = 'Folder'
export const setFolderData = (folderId, content) => ({ type: `Set/${WORKSPACE}/${FOLDER}/Content`, folderId, content })

export const WORKSPACE_LIST = 'WorkspaceList'
export const updateWorkspaceListData = workspaceList => ({ type: `Update/${WORKSPACE_LIST}`, workspaceList })
export const setWorkspaceListIsOpenInSidebar = (workspaceId, isOpenInSidebar) => ({ type: `Set/${WORKSPACE_LIST}/isOpenInSidebar`, workspaceId, isOpenInSidebar })

export const APP_LIST = 'App/List'
export const setAppList = appList => ({ type: `Set/${APP_LIST}`, appList })

export const LANG = 'Lang'
export const updateLangList = langList => ({ type: `Update/${LANG}`, langList })
export const setLangActive = langId => ({ type: `Set/${LANG}/Active`, langId })
