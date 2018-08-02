import { combineReducers } from 'redux'
import lang from './lang.js'
import flashMessage from './flashMessage.js'
import user from './user.js'
import currentWorkspace from './currentWorkspace.js'
import workspaceContentList from './workspaceContentList.js'
import workspaceList from './workspaceList.js'
import appList from './appList.js'
import contentType from './contentType.js'
import timezone from './timezone.js'

const rootReducer = combineReducers({ lang, flashMessage, user, currentWorkspace, workspaceContentList, workspaceList, appList, contentType, timezone })

export default rootReducer
