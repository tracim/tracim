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
  content: [],
  filter: []
}, action) {
  switch (action.type) {
    case `Set/${WORKSPACE}`:
      return {
        ...serializeWorkspace(action.workspace),
        filter: action.filterStr ? action.filterStr.split(';') : []
      }

    case `Update/${WORKSPACE}/Filter`:
      return {...state, filter: action.filterList}

    default:
      return state
  }
}
