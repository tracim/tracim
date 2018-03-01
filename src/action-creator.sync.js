export const USER_LOGIN = 'User/Login'
export const USER_DATA = 'User/Data'

export const USER_CONNECTED = 'User/Connected'
export const updateUserConnected = user => ({ type: `Update/${USER_CONNECTED}`, user })
export const updateUserData = userData => ({ type: `Update/${USER_DATA}`, data: userData })

export const WORKSPACE = 'Workspace'
export const updateWorkspaceData = workspace => ({ type: `Update/${WORKSPACE}`, workspace })

export const FILE_CONTENT = 'FileContent'
export const setActiveFileContent = file => ({ type: `Set/${FILE_CONTENT}/Active`, file })
export const hideActiveFileContent = () => ({ type: `Set/${FILE_CONTENT}/Hide` })

export const APP_LIST = 'App/List'
export const setAppList = appList => ({ type: `Set/${APP_LIST}`, appList })
