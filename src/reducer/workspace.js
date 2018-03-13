import {
  WORKSPACE
} from '../action-creator.sync.js'

const serializeWorkspace = data => ({
  id: data.id,
  title: data.title,
  content: data.content,
  ownerId: data.owner_id
})

export default function user (state = {
  id: -1,
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
