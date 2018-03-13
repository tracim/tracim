import { combineReducers } from 'redux'
import lang from './lang.js'
import user from './user.js'
import workspace from './workspace.js'
import workspaceList from './workspaceList.js'
import activeFileContent from './activeFileContent.js'
import app from './app.js'
import timezone from './timezone.js'

const rootReducer = combineReducers({ lang, user, workspace, workspaceList, activeFileContent, app, timezone })

export default rootReducer
