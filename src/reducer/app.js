import { APP_LIST } from '../action-creator.sync.js'

export default function app (state = {}, action) {
  switch (action.type) {
    case `Set/${APP_LIST}`:
      const rez = {}
      action.appList.forEach(app => (rez[app.name] = app))
      return rez

    default:
      return state
  }
}
