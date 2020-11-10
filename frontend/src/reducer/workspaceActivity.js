import {
  SET,
  WORKSPACE_ACTIVITY_LIST
} from '../action-creator.sync.js'

const workspaceActivityList = (state = [], action) => {
  switch (action.type) {
    case `${SET}/${WORKSPACE_ACTIVITY_LIST}`:
      return action.activityList
    default:
      return state
  }
}

export default workspaceActivityList
