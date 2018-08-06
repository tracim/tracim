import {
  SET,
  UPDATE,
  WORKSPACE,
  WORKSPACE_CONTENT,
  FOLDER
} from '../action-creator.sync.js'

export default function workspaceContentList (state = [], action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_CONTENT}`:
      return action.workspaceContentList.map(wsc => ({
        id: wsc.content_id,
        label: wsc.label,
        slug: wsc.slug,
        type: wsc.content_type,
        idWorkspace: wsc.workspace_id,
        isArchived: wsc.is_archived,
        idParent: wsc.parent_id,
        isDeleted: wsc.is_deleted,
        showInUi: wsc.show_in_ui,
        statusSlug: wsc.status,
        subContentTypeSlug: wsc.sub_content_type_slug
      }))

    case `${UPDATE}/${WORKSPACE}/Filter`: // not used anymore ?
      return {...state, filter: action.filterList}

    case `${SET}/${WORKSPACE}/${FOLDER}/Content`:
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
