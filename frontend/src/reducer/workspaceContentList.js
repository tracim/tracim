import { uniqBy } from 'lodash'
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
  REMOVE,
  RESTORE,
  CONTENT
} from '../action-creator.sync.js'
import { serialize } from 'tracim_frontend_lib'
import { CONTENT_NAMESPACE } from '../util/helper'

export const serializeContentProps = {
  author: 'author',
  content_id: 'id',
  content_namespace: 'contentNamespace',
  current_revision_id: 'currentRevisionId',
  label: 'label',
  modified: 'modified',
  slug: 'slug',
  raw_content: 'rawContent',
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
  created: 'created',
  parent_content_type: 'parentContentType',
  parent_label: 'parentLabel',
  current_revision_type: 'currentRevisionType'
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
      if (
        state.workspaceId !== action.workspaceId ||
        !action.workspaceContentList.some(cc => cc.content_namespace === CONTENT_NAMESPACE.CONTENT)
      ) return state

      const parentIdList = [
        ...state.contentList.filter(c => c.parentId),
        ...action.workspaceContentList.filter(c => c.parentId)
      ]

      const newContentList = [
        ...state.contentList,
        ...action.workspaceContentList
          .filter(cc => cc.content_namespace === CONTENT_NAMESPACE.CONTENT)
          .map(c => ({
            ...serialize(c, serializeContentProps),
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
      if (!action.workspaceContentList.some(cc => cc.content_namespace === CONTENT_NAMESPACE.CONTENT)) return state

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
            .filter(cc => cc.content_namespace === CONTENT_NAMESPACE.CONTENT)
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
        .filter(c => c.content_namespace === CONTENT_NAMESPACE.CONTENT)
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
      if (
        state.workspaceId !== action.workspaceId ||
        !action.workspaceContentList.some(cc => cc.content_namespace === CONTENT_NAMESPACE.CONTENT)
      ) return state
      return {
        workspaceId: state.workspaceId,
        contentList: state.contentList.filter(c => !action.workspaceContentList.some(cc => c.id === cc.content_id))
      }

    default:
      return state
  }
}
