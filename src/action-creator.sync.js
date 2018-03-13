export const TIMEZONE = 'Timezone'
export const setTimezone = timezone => ({ type: `Set/${TIMEZONE}`, timezone })

export const USER_LOGIN = 'User/Login'
export const USER_DATA = 'User/Data'
export const USER_ROLE = 'User/Role'
export const USER_CONNECTED = 'User/Connected'
export const setUserConnected = user => ({ type: `Set/${USER_CONNECTED}`, user })
export const updateUserData = userData => ({ type: `Update/${USER_DATA}`, data: userData })
export const setUserRole = userRole => ({ type: `Set/${USER_ROLE}`, userRole }) // this actually update workspaceList state
export const updateUserWorkspaceSubscriptionNotif = (workspaceId, subscriptionNotif) =>
  ({ type: `Update/${USER_ROLE}/SubscriptionNotif`, workspaceId, subscriptionNotif })

export const WORKSPACE = 'Workspace'
export const updateWorkspaceData = workspace => ({ type: `Update/${WORKSPACE}`, workspace })

export const WORKSPACE_LIST = 'WorkspaceList'
export const updateWorkspaceListData = workspaceList => ({ type: `Update/${WORKSPACE_LIST}`, workspaceList })
export const setWorkspaceListisOpenInSidebar = (workspaceId, isOpenInSidebar) => ({ type: `Set/${WORKSPACE_LIST}/isOpenInSidebar`, workspaceId, isOpenInSidebar })

export const FILE_CONTENT = 'FileContent'
export const setActiveFileContentActive = file => ({ type: `Set/${FILE_CONTENT}/Active`, file })
export const setActiveFileContentHide = () => ({ type: `Set/${FILE_CONTENT}/Hide` })

export const APP_LIST = 'App/List'
export const setAppList = appList => ({ type: `Set/${APP_LIST}`, appList })

export const LANG = 'Lang'
export const updateLangList = langList => ({ type: `Update/${LANG}`, langList })
export const setLangActive = langId => ({ type: `Set/${LANG}/Active`, langId })
