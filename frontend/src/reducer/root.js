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
import workspaceActivityList from './workspaceActivityList.js'

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
  searchResult,
  notificationPage,
  accessibleWorkspaceList,
  workspaceSubscriptionList,
  workspaceActivityList
})

export default rootReducer
