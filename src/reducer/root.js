import { combineReducers } from 'redux'
import user from './user.js'
import workspace from './workspace.js'
import activeFileContent from './activeFileContent.js'
import plugin from './plugin.js'

const rootReducer = combineReducers({ user, workspace, activeFileContent, plugin })

export default rootReducer
