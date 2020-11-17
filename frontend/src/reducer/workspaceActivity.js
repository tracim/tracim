import {
  SET,
  WORKSPACE_ACTIVITY,
  LIST,
  NEXT_PAGE
} from '../action-creator.sync.js'

const defaultWorkspaceActivityState = {
  list: [],
  hasNextPage: true,
  nextPageToken: null
}

const workspaceActivity = (state = defaultWorkspaceActivityState, action) => {
  switch (action.type) {
    case `${SET}/${WORKSPACE_ACTIVITY}/${LIST}`:
      return { ...state, list: action.activityList }
    case `${SET}/${WORKSPACE_ACTIVITY}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }
    default:
      return state
  }
}

export default workspaceActivity
