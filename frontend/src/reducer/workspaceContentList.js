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
import { serialize } from 'tracim_frontend_lib'

export const serializeContentProps = {
  content_id: 'id',
  label: 'label',
  slug: 'slug',
  content_type: 'type',
  filename: 'fileName',
  file_extension: 'fileExtension',
  workspace_id: 'workspaceId',
  is_archived: 'isArchived',
  parent_id: 'parentId',
  is_deleted: 'isDeleted',
  show_in_ui: 'showInUi',
  status: 'statusSlug',
  sub_content_types: 'subContentTypeList',
  isOpen: 'isOpen',
  actives_shares: 'activedShares',
  created: 'created'
}

const defaultWorkspaceContentList = {
  workspaceId: 0,
  contentList: []
}

export default function workspaceContentList (state = defaultWorkspaceContentList, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_CONTENT}`:
      return {
        workspaceId: action.workspaceId,
        contentList: action.workspaceContentList.map(c => ({
          ...serialize(c, serializeContentProps),
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
            ...serialize(c, serializeContentProps),
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
            ...serialize(c, serializeContentProps),
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
