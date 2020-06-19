import {
  SET,
  ADD,
  UPDATE,
  TOGGLE,
  WORKSPACE,
  WORKSPACE_CONTENT,
  FOLDER,
  WORKSPACE_CONTENT_ARCHIVED,
  WORKSPACE_CONTENT_DELETED,
  REMOVE, RESTORE
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

export default function workspaceContentList (state = {}, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_CONTENT}`:
      return {
        workspaceId: action.workspaceId,
        contentList: action.workspaceContentList.map(c => ({
          ...serializeContent(c),
          isOpen: action.folderIdToOpenList.includes(c.content_id)
        }))
      }

    case `${RESTORE}/${WORKSPACE_CONTENT}`:
    case `${ADD}/${WORKSPACE_CONTENT}`: {
      if (state.workspaceId !== action.workspaceId) return state
      const parentIdList = [
        ...state.contentList.filter(c => c.parentId),
        ...action.workspaceContentList.filter(c => c.parentId)
      ]
      return {
        workspaceId: state.workspaceId,
        contentList: [
          ...state.contentList,
          ...action.workspaceContentList.map(c => ({
            ...serializeContent(c),
            isOpen: parentIdList.includes(c.content_id)
          }))
        ]
      }
    }

    case `${UPDATE}/${WORKSPACE_CONTENT}`: {
      if (state.workspaceId !== action.workspaceId) return state
      const parentIdList = [
        ...state.contentList.filter(c => c.parentId),
        ...action.workspaceContentList.filter(c => c.parentId)
      ]
      return {
        workspaceId: state.workspaceId,
        contentList: [
          ...state.contentList.filter(c => !action.workspaceContentList.some(wc => wc.content_id === c.id)),
          ...action.workspaceContentList.map(c => ({
            ...serializeContent(c),
            isOpen: parentIdList.includes(c.content_id)
          }))
        ]
      }
    }

    case `${TOGGLE}/${WORKSPACE}/${FOLDER}`:
      if (state.workspaceId !== action.workspaceId) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.map(c => c.id === action.folderId ? { ...c, isOpen: !c.isOpen } : c)
      }

    case `${SET}/${WORKSPACE_CONTENT_ARCHIVED}`:
      if (state.workspaceId !== action.workspaceId) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.map(wsc => wsc.workspaceId === action.workspaceId && wsc.id === action.contentId
          ? { ...wsc, isArchived: true }
          : wsc
        )
      }

    case `${SET}/${WORKSPACE_CONTENT_DELETED}`:
      if (state.workspaceId !== action.workspaceId) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.filter(wsc => wsc.id !== action.contentId)
      }

    case `${REMOVE}/${WORKSPACE_CONTENT}`:
      if (state.workspaceId !== action.workspaceId) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.filter(c => !action.workspaceContentList.some(cc => c.id === cc.content_id))
      }

    default:
      return state
  }
}
