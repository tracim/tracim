import { combineReducers } from 'redux'
import user from './user.js'
import workspace from './workspace.js'
import workspaceList from './workspaceList.js'
import activeFileContent from './activeFileContent.js'
import app from './app.js'

const rootReducer = combineReducers({ user, workspace, workspaceList, activeFileContent, app })

export default rootReducer
