import { PLUGIN_LIST } from '../../../action-creator.sync.js'

export default function thread (state = {
  title: '',
  version: 0,
  icon: ''
}, action) {
  switch (action.type) {
    case `Set/${PLUGIN_LIST}`:
      return action.pluginList.find(p => p.name === 'Thread')

    default:
      return state
  }
}
