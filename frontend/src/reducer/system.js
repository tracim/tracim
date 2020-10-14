import {
  APP_LIST,
  CONTENT_TYPE_LIST,
  SET,
  WORKSPACE_LIST,
  CONFIG,
  LOGIN,
  HEAD_TITLE
} from '../action-creator.sync.js'
import { buildHeadTitle } from 'tracim_frontend_lib'

export const defaultSystem = {
  redirectLogin: '',
  workspaceListLoaded: false,
  appListLoaded: false,
  contentTypeListLoaded: false,
  config: {},
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
      const newHeadTitle = buildHeadTitle([action.headTitle, state.config.instance_name])
      if (newHeadTitle === state.headTitle || !state.config.instance_name) return state
      return { ...state, headTitle: newHeadTitle }
    }

    default:
      return state
  }
}

export default system
