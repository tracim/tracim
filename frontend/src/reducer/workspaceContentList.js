import { uniqBy } from 'lodash'
import {
  SET,
  ADD,
  UPDATE,
  TOGGLE,
  FOLDER,
  WORKSPACE,
  WORKSPACE_CONTENT,
  WORKSPACE_CONTENT_ARCHIVED,
  WORKSPACE_CONTENT_DELETED,
  REMOVE,
  RESTORE,
  CONTENT
} from '../action-creator.sync.js'
import { serialize, CONTENT_NAMESPACE } from 'tracim_frontend_lib'

export const serializeContentProps = {
  actives_shares: 'activedShares',
  author: 'author',
  content_id: 'id',
  content_namespace: 'contentNamespace',
  content_type: 'type',
  created: 'created',
  created_raw: 'createdRaw',
  current_revision_id: 'currentRevisionId',
  current_revision_type: 'currentRevisionType',
  file_extension: 'fileExtension',
  filename: 'fileName',
  is_archived: 'isArchived',
  is_deleted: 'isDeleted',
  is_template: 'isTemplate',
  isOpen: 'isOpen',
  label: 'label',
  last_modifier: 'lastModifier',
  modified: 'modified',
  parent_content_namespace: 'parentContentNamespace',
  parent_content_type: 'parentContentType',
  parent_id: 'parentId',
  parent_label: 'parentLabel',
  raw_content: 'rawContent',
  show_in_ui: 'showInUi',
  slug: 'slug',
  status: 'statusSlug',
  sub_content_types: 'subContentTypeList',
  workspace_id: 'workspaceId'
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
