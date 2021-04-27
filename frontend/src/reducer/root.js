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
import publicationList from './publicationList.js'
import workspaceSubscriptionList from './workspaceSubscriptionList.js'
import workspaceActivity from './workspaceActivity.js'
import userActivity from './userActivity.js'
import { ADVANCED_SEARCH_TYPE, SEARCH_TYPE } from '../util/helper.js'
import favoriteList from './favoriteList.js'

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
  simpleSearch: searchResult(SEARCH_TYPE.SIMPLE),
  contentSearch: searchResult(ADVANCED_SEARCH_TYPE.CONTENT),
  userSearch: searchResult(ADVANCED_SEARCH_TYPE.USER),
  spaceSearch: searchResult(ADVANCED_SEARCH_TYPE.SPACE),
  notificationPage,
  accessibleWorkspaceList,
  publicationList,
  workspaceSubscriptionList,
  workspaceActivity,
  userActivity,
  favoriteList
})

export default rootReducer
