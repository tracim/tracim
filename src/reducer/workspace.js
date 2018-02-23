import {
  WORKSPACE
} from '../action-creator.sync.js'

const serializeWorkspace = data => ({
  ...data,
  ownerId: data.owner_id
})

export default function user (state = {
  id: 0,
  title: '',
  ownerId: '',
  content: []
}, action) {
  switch (action.type) {
    case `Update/${WORKSPACE}`:
      return serializeWorkspace(action.workspace)

    default:
      return state
  }
}
