import { APP_LIST } from '../../../action-creator.sync.js'

export default function pageHtml (state = {
  title: '',
  version: 0,
  icon: ''
}, action) {
  switch (action.type) {
    case `Set/${APP_LIST}`:
      return action.appList.find(p => p.name === 'PageHtml')

    default:
      return state
  }
}
