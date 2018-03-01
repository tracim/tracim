import { combineReducers } from 'redux'
import user from './user.js'
import workspace from './workspace.js'
import activeFileContent from './activeFileContent.js'
import app from './app.js'

const rootReducer = combineReducers({ user, workspace, activeFileContent, app })

export default rootReducer
