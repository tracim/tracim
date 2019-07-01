import {
  APP_LIST,
  CONTENT_TYPE_LIST,
  CUSTOM_FORM_CONTENT_TYPE_LIST,
  SET,
  WORKSPACE_LIST,
  CONFIG, LOGIN
} from '../action-creator.sync.js'

const defaultSystem = {
  redirectLogin: '',
  workspaceListLoaded: false,
  appListLoaded: false,
  contentTypeListLoaded: false,
  customFormTypeLoaded: false,
  config: {}
}

export function system (state = defaultSystem, action) {
  switch (action.type) {
    case `${SET}/${LOGIN}/Redirect`:
      return {...state, redirectLogin: action.url}

    case `${SET}/${WORKSPACE_LIST}`:
      return {...state, workspaceListLoaded: true}

    case `${SET}/${APP_LIST}`:
      return {...state, appListLoaded: true}

    case `${SET}/${CONTENT_TYPE_LIST}`:
      return {...state, contentTypeListLoaded: true}

    case `${SET}/${CUSTOM_FORM_CONTENT_TYPE_LIST}`:
      return {...state, customFormTypeLoaded: true}

    case `${SET}/${CONFIG}`:
      return {...state, config: action.config}

    default:
      return state
  }
}

export default system
