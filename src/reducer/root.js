import { combineReducers } from 'redux'
import lang from './lang.js'
import flashMessage from './flashMessage.js'
import user from './user.js'
import workspace from './workspace.js'
import workspaceList from './workspaceList.js'
import app from './app.js'
import timezone from './timezone.js'

const rootReducer = combineReducers({ lang, flashMessage, user, workspace, workspaceList, app, timezone })

export default rootReducer
