import {
  WORKSPACE,
  FOLDER
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

    case `Set/${WORKSPACE}/${FOLDER}/Content`:
      const setFolderContent = (contentItem, action) => {
        if (contentItem.id === action.folderId) return {...contentItem, content: action.content}

        if (contentItem.type === 'folder') return {...contentItem, content: contentItem.content.map(c => setFolderContent(c, action))}

        return contentItem
      }

      return {
        ...state,
        content: state.content.map(c => setFolderContent(c, action))
      }

    default:
      return state
  }
}
