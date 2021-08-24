import {
  SET,
  RESET,
  USER_ACTIVITY,
  LIST,
  NEXT_PAGE,
  EVENT_LIST
} from '../action-creator.sync.js'

import { setActivityEventList } from '../util/activity.js'

const defaultUserActivityState = {
  list: [],
  loaded: false,
  hasNextPage: true,
  nextPageToken: null
}

const userActivity = (state = defaultUserActivityState, action) => {
  switch (action.type) {
    case `${RESET}/${USER_ACTIVITY}`:
      return defaultUserActivityState
    case `${SET}/${USER_ACTIVITY}/${LIST}`:
      return { ...state, list: action.activityList, loaded: true }
    case `${SET}/${USER_ACTIVITY}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }
    case `${SET}/${USER_ACTIVITY}/${EVENT_LIST}`:
      return { ...state, list: setActivityEventList(action.activityId, state.list, action.messageList) }
    default:
      return state
  }
}

export default userActivity
