import {
  SET,
  RESET,
  USER_ACTIVITY,
  LIST,
  NEXT_PAGE
} from '../action-creator.sync.js'

const defaultUserActivityState = {
  list: [],
  hasNextPage: true,
  nextPageToken: null
}

const userActivity = (state = defaultUserActivityState, action) => {
  switch (action.type) {
    case `${RESET}/${USER_ACTIVITY}`:
      return defaultUserActivityState
    case `${SET}/${USER_ACTIVITY}/${LIST}`:
      return { ...state, list: action.activityList }
    case `${SET}/${USER_ACTIVITY}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }
    default:
      return state
  }
}

export default userActivity
