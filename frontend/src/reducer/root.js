import { combineReducers } from 'redux'
import lang from './lang.js'
import breadcrumbs from './breadcrumbs.js'
import flashMessage from './flashMessage.js'
import user from './user.js'
import currentWorkspace from './currentWorkspace.js'
import workspaceContentList from './workspaceContentList.js'
import workspaceShareFolderContentList from './workspaceShareFolderContentList.js'
import workspaceList from './workspaceList.js'
import appList from './appList.js'
import contentType from './contentType.js'
import timezone from './timezone.js'
import system from './system.js'
import searchResult from './searchResult.js'
import notificationPage from './notificationPage.js'
import accessibleWorkspaceList from './accessibleWorkspaceList.js'
import workspaceSubscriptionList from './workspaceSubscriptionList.js'
import workspaceActivity from './workspaceActivity.js'
import userActivity from './userActivity.js'

const rootReducer = combineReducers({
  lang,
  breadcrumbs,
  flashMessage,
  user,
  currentWorkspace,
  workspaceContentList,
  workspaceShareFolderContentList,
  workspaceList,
  appList,
  contentType,
  timezone,
  system,
  simpleSearch: searchResult('simple'),
  contentSearch: searchResult('content'),
  userSearch: searchResult('user'),
  spaceSearch: searchResult('space'),
  notificationPage,
  accessibleWorkspaceList,
  workspaceSubscriptionList,
  workspaceActivity,
  userActivity
})

export default rootReducer
