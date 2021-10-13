import { isEqual } from 'lodash'
import {
  APP_LIST,
  CONTENT_TYPE_LIST,
  SET,
  WORKSPACE_LIST,
  CONFIG,
  LOGIN,
  HEAD_TITLE
} from '../action-creator.sync.js'

export const defaultSystem = {
  redirectLogin: '',
  workspaceListLoaded: false,
  appListLoaded: false,
  contentTypeListLoaded: false,
  config: {},
  titleArgs: [],
  headTitle: ''
}

export function system (state = defaultSystem, action) {
  switch (action.type) {
    case `${SET}/${LOGIN}/Redirect`:
      return { ...state, redirectLogin: action.url }

    case `${SET}/${WORKSPACE_LIST}`:
      return { ...state, workspaceListLoaded: true }

    case `${SET}/${APP_LIST}`:
      return { ...state, appListLoaded: true }

    case `${SET}/${CONTENT_TYPE_LIST}`:
      return { ...state, contentTypeListLoaded: true }

    case `${SET}/${CONFIG}`:
      return { ...state, config: action.config }

    case `${SET}/${HEAD_TITLE}`: {
      const titleArgs = action.titlePrefix === '' ? [action.headTitle, state.config.instance_name] : [action.titlePrefix, action.headTitle, state.config.instance_name]

      if (isEqual(titleArgs, state.titleArgs)) return state
      return { ...state, titleArgs, headTitle: action.headTitle }
    }

    default:
      return state
  }
}

export default system
