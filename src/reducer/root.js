import { combineReducers } from 'redux'
import lang from './lang.js'
import user from './user.js'
import workspace from './workspace.js'
import workspaceList from './workspaceList.js'
import activeFileContent from './activeFileContent.js'
import app from './app.js'

const rootReducer = combineReducers({ lang, user, workspace, workspaceList, activeFileContent, app })

export default rootReducer
