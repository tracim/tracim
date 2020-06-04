import {
  SET,
  ADD,
  UPDATE,
  TOGGLE,
  WORKSPACE,
  WORKSPACE_CONTENT,
  FOLDER,
  WORKSPACE_CONTENT_ARCHIVED,
  WORKSPACE_CONTENT_DELETED
} from '../action-creator.sync.js'

export const serializeContent = c => ({
  id: c.content_id,
  label: c.label,
  slug: c.slug,
  type: c.content_type,
  fileName: c.filename,
  fileExtension: c.file_extension,
  workspaceId: c.workspace_id,
  isArchived: c.is_archived,
  parentId: c.parent_id,
  isDeleted: c.is_deleted,
  showInUi: c.show_in_ui,
  statusSlug: c.status,
  subContentTypeList: c.sub_content_types,
  isOpen: c.isOpen ? c.isOpen : false, // only useful for folder
  activedShares: c.actives_shares,
  created: c.created
})

export default function workspaceContentList (state = [], action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_CONTENT}`:
      return action.workspaceContentList.map(c => ({
        ...serializeContent(c),
        isOpen: action.folderIdToOpenList.includes(c.content_id)
      }))

    case `${ADD}/${WORKSPACE_CONTENT}`: {
      const parentIdList = [
        ...state.filter(c => c.parentId),
        ...action.workspaceContentList.filter(c => c.parentId)
      ]
      return [
        ...state,
        ...action.workspaceContentList.map(c => ({
          ...serializeContent(c),
          isOpen: parentIdList.includes(c.content_id)
        }))
      ]
    }

    case `${UPDATE}/${WORKSPACE_CONTENT}`: {
      const parentIdList = [
        ...state.filter(c => c.parentId),
        ...action.workspaceContentList.filter(c => c.parentId)
      ]
      return [
        ...state.filter(c => !action.workspaceContentList.some(wc => wc.content_id === c.id)),
        ...action.workspaceContentList.map(c => ({
          ...serializeContent(c),
          isOpen: parentIdList.includes(c.content_id)
        }))
      ]
    }

    case `${TOGGLE}/${WORKSPACE}/${FOLDER}`:
      return state.map(c => c.id === action.folderId ? { ...c, isOpen: !c.isOpen } : c)

    case `${SET}/${WORKSPACE_CONTENT_ARCHIVED}`:
      return state.map(wsc => wsc.workspaceId === action.workspaceId && wsc.id === action.contentId
        ? { ...wsc, isArchived: true }
        : wsc
      )

    case `${SET}/${WORKSPACE_CONTENT_DELETED}`:
      return state.filter(wsc => wsc.id !== action.contentId)

    default:
      return state
  }
}
