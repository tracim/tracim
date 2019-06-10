import { combineReducers } from 'redux'
import lang from './lang.js'
import breadcrumbs from './breadcrumbs.js'
import flashMessage from './flashMessage.js'
import user from './user.js'
import currentWorkspace from './currentWorkspace.js'
import workspaceContentList from './workspaceContentList.js'
import workspaceList from './workspaceList.js'
import appList from './appList.js'
import contentType from './contentType.js'
import timezone from './timezone.js'
import system from './system.js'
import searchResult from './searchResult.js'

const rootReducer = combineReducers({
  lang,
  breadcrumbs,
  flashMessage,
  user,
  currentWorkspace,
  workspaceContentList,
  workspaceList,
  appList,
  contentType,
  timezone,
  system,
  searchResult
})

export default rootReducer
