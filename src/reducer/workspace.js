import {
  WORKSPACE,
  FOLDER
} from '../action-creator.sync.js'

export default function workspace (state = [], action) {
  switch (action.type) {
    case `Set/${WORKSPACE}/Content`:
      return action.workspaceContent.map(wsc => ({
        id: wsc.id,
        label: wsc.label,
        slug: wsc.slug,
        type: wsc.content_type_slug,
        workspaceId: wsc.workspace_id,
        isArchived: wsc.is_archived,
        parentId: wsc.parent_id,
        isDeleted: wsc.is_deleted,
        // show_in_ui: wsc.show_in_ui, ???
        statusSlug: wsc.status_slug,
        subContentTypeSlug: wsc.sub_content_type_slug,
      }))

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
