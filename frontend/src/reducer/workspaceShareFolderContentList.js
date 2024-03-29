import { uniqBy } from 'lodash'
import {
  SET,
  TOGGLE,
  WORKSPACE,
  FOLDER,
  UPDATE,
  WORKSPACE_CONTENT_SHARE_FOLDER, ADD,
  WORKSPACE_CONTENT_SHARE_FOLDER_ARCHIVED,
  WORKSPACE_CONTENT_SHARE_FOLDER_DELETED,
  REMOVE,
  RESTORE,
  WORKSPACE_CONTENT,
  CONTENT
} from '../action-creator.sync.js'
import { serialize, CONTENT_TYPE, CONTENT_NAMESPACE } from 'tracim_frontend_lib'
import { serializeContentProps } from './workspaceContentList'
import { SHARE_FOLDER_ID } from '../util/helper'

const defaultWorkspaceShareFolderContentList = {
  workspaceId: 0,
  contentList: []
}

export default function workspaceShareFolderContentList (state = defaultWorkspaceShareFolderContentList, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER}`:
      return {
        workspaceId: action.workspaceId,
        contentList: action.workspaceShareFolderContentList.map(c => ({
          ...serialize(c, serializeContentProps),
          isOpen: action.folderIdToOpenList.includes(c.content_id)
        }))
      }

    case `${TOGGLE}/${WORKSPACE}/${FOLDER}`:
      if (state.workspaceId !== action.workspaceId) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.map(c => c.id === action.folderId ? { ...c, isOpen: !c.isOpen } : c)
      }

    case `${RESTORE}/${WORKSPACE_CONTENT}`:
    case `${ADD}/${WORKSPACE_CONTENT}`: {
      if (
        state.workspaceId !== action.workspaceId ||
        !action.workspaceContentList.some(cc => cc.content_namespace === CONTENT_NAMESPACE.UPLOAD)
      ) return state

      const parentIdList = [
        ...state.contentList.filter(c => c.parentId),
        ...action.workspaceContentList.filter(c => c.parentId)
      ]

      const newContentList = [
        ...state.contentList,
        ...action.workspaceContentList
          .filter(cc => cc.content_namespace === CONTENT_NAMESPACE.UPLOAD)
          .map(c => ({
            ...serialize(c, serializeContentProps),
            parentId: c.content_type === CONTENT_TYPE.FOLDER ? SHARE_FOLDER_ID : c.parent_id,
            isOpen: parentIdList.includes(c.content_id)
          }))
      ]
      const newUniqueContentList = uniqBy(newContentList, 'id')

      return {
        ...state,
        contentList: newUniqueContentList
      }
    }

    case `${UPDATE}/${WORKSPACE_CONTENT}`: {
      if (!action.workspaceContentList.some(cc => cc.content_namespace === CONTENT_NAMESPACE.UPLOAD)) return state

      if (state.workspaceId !== action.workspaceId) {
        return {
          workspaceId: state.workspaceId,
          contentList: state.contentList.filter(c => !action.workspaceContentList.some(cc => c.id === cc.content_id))
        }
      }

      const parentIdList = [
        ...state.contentList.filter(c => c.parentId),
        ...action.workspaceContentList.filter(c => c.parentId)
      ]
      return {
        workspaceId: state.workspaceId,
        contentList: [
          ...state.contentList.filter(c => !action.workspaceContentList.some(wc => wc.content_id === c.id)),
          ...action.workspaceContentList
            .filter(cc => cc.content_namespace === CONTENT_NAMESPACE.UPLOAD)
            .map(c => ({
              ...serialize(c, serializeContentProps),
              isOpen: parentIdList.includes(c.content_id)
            }))
        ]
      }
    }

    case `${SET}/${WORKSPACE}/${FOLDER}/${CONTENT}`: {
      if (state.workspaceId !== action.workspaceId) return state

      const contentListToAdd = action.contentList
        .filter(c => c.content_namespace === CONTENT_NAMESPACE.UPLOAD)
        .map(c => serialize(c, serializeContentProps))

      // INFO - CH - 2020-07-01 - this process will keep the children of potential sub folders of action.folderId,
      // we don't recursively remove them because it's a lot of process and it isn't required
      const contentListFreeFromContentOfSameFolder = state.contentList.filter(c => c.parentId !== action.folderId)

      return {
        ...state,
        contentList: [
          ...contentListFreeFromContentOfSameFolder,
          ...contentListToAdd
        ]
      }
    }

    case `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER_ARCHIVED}`:
      if (state.workspaceId !== action.workspaceId) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.map(wsc => wsc.workspaceId === action.workspaceId && wsc.id === action.contentId
          ? { ...wsc, isArchived: true }
          : wsc
        )
      }

    case `${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER_DELETED}`:
      if (state.workspaceId !== action.workspaceId) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.filter(wsc => wsc.id !== action.contentId)
      }

    case `${REMOVE}/${WORKSPACE_CONTENT}`:
      if (
        state.workspaceId !== action.workspaceId ||
        !action.workspaceContentList.some(cc => cc.content_namespace === CONTENT_NAMESPACE.UPLOAD)
      ) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.filter(c => !action.workspaceContentList.some(cc => c.id === cc.content_id))
      }

    default:
      return state
  }
}
