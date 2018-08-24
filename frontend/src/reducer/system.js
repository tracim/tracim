import {
  APP_LIST,
  CONTENT_TYPE_LIST,
  SET,
  WORKSPACE_LIST
} from '../action-creator.sync.js'

const defaultSystem = {
  workspaceListLoaded: false,
  appListLoaded: false,
  contentTypeListLoaded: false
}

export function system (state = defaultSystem, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_LIST}`:
      return {...state, workspaceListLoaded: true}

    case `${SET}/${APP_LIST}`:
      return {...state, appListLoaded: true}

    case `${SET}/${CONTENT_TYPE_LIST}`:
      return {...state, contentTypeListLoaded: true}

    default:
      return state
  }
}

export default system
