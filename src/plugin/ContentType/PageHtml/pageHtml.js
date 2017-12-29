import { PLUGIN_LIST } from '../../../action-creator.sync.js'

export default function pageHtml (state = {
  title: '',
  version: 0
}, action) {
  switch (action.type) {
    case `Set/${PLUGIN_LIST}`:
      return action.pluginList.find(p => p.name === 'PageHtml')

    default:
      return state
  }
}
