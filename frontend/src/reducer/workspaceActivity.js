import {
  SET,
  RESET,
  WORKSPACE_ACTIVITY,
  LIST,
  NEXT_PAGE,
  EVENT_LIST
} from '../action-creator.sync.js'

import { setActivityEventList } from '../util/activity.js'

const defaultWorkspaceActivityState = {
  list: [],
  hasNextPage: true,
  nextPageToken: null
}

const workspaceActivity = (state = defaultWorkspaceActivityState, action) => {
  switch (action.type) {
    case `${RESET}/${WORKSPACE_ACTIVITY}`:
      return defaultWorkspaceActivityState
    case `${SET}/${WORKSPACE_ACTIVITY}/${LIST}`:
      return { ...state, list: action.activityList }
    case `${SET}/${WORKSPACE_ACTIVITY}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }
    case `${SET}/${WORKSPACE_ACTIVITY}/${EVENT_LIST}`:
      return { ...state, list: setActivityEventList(action.activityId, state.list, action.messageList) }
    default:
      return state
  }
}

export default workspaceActivity
