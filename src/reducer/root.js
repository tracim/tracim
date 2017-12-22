import { combineReducers } from 'redux'
import user from './user.js'
import workspace from './workspace.js'
import activeFileContent from './activeFileContent.js'

const rootReducer = combineReducers({ user, workspace, activeFileContent })

export default rootReducer
