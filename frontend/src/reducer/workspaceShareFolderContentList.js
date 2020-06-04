import {
  SET,
  TOGGLE,
  WORKSPACE,
  FOLDER,
  UPDATE,
  WORKSPACE_CONTENT_SHARE_FOLDER, ADD, WORKSPACE_CONTENT_SHARE_FOLDER_ARCHIVED, WORKSPACE_CONTENT_SHARE_FOLDER_DELETED
} from '../action-creator.sync.js'
import { serializeContent } from './workspaceContentList.js'

export default function workspaceShareFolderContentList (state = [], action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER}`:
      return action.workspaceShareFolderContentList.map(c => ({
        ...serializeContent(c),
        isOpen: action.folderIdToOpenList.includes(c.content_id)
      }))

    case `${TOGGLE}/${WORKSPACE}/${FOLDER}`:
      return state.map(c => c.id === action.folderId ? { ...c, isOpen: !c.isOpen } : c)

    case `${ADD}/${WORKSPACE_CONTENT_SHARE_FOLDER}`: {
      const parentIdList = [
        ...state.filter(c => c.parentId),
        ...action.workspaceShareFolderContentList.filter(c => c.parentId)
      ]

      return [
        ...state,
        ...action.workspaceShareFolderContentList.map(c => ({
          ...serializeContent(c),
          isOpen: parentIdList.includes(c.content_id)
        }))
      ]
    }

    case `${UPDATE}/${WORKSPACE_CONTENT_SHARE_FOLDER}`: {
      const parentIdList = [
        ...state.filter(c => c.parentId),
        ...action.workspaceShareFolderContentList.filter(c => c.parentId)
      ]
      return [
        ...state.filter(c => !action.workspaceShareFolderContentList.some(wc => wc.content_id === c.id)),
        ...action.workspaceShareFolderContentList.map(c => ({
          ...serializeContent(c),
          isOpen: parentIdList.includes(c.content_id)
        }))
      ]
    }

    case `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER_ARCHIVED}`:
      return state.map(wsc => wsc.workspaceId === action.workspaceId && wsc.id === action.contentId
        ? { ...wsc, isArchived: true }
        : wsc
      )

    case `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER_DELETED}`:
      return state.filter(wsc => wsc.id !== action.contentId)

    default:
      return state
  }
}
