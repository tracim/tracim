import {
  APPEND,
  REMOVE,
  SEARCH_RESULTS_LIST,
  SEARCHED_KEYWORDS,
  SEARCH_RESULTS_BY_PAGE,
  SEARCH_CURRENT_PAGE,
  SET,
  UPDATE,
  WORKSPACE_CONTENT,
  WORKSPACE_DETAIL
} from '../action-creator.sync.js'
import { uniqBy } from 'lodash'
import {
  serialize,
  NUMBER_RESULTS_BY_PAGE
} from 'tracim_frontend_lib'

export const serializeSearchItemProps = {
  author: 'author',
  content_id: 'contentId',
  content_type: 'contentType',
  created: 'created',
  current_revision_id: 'currentRevisionId',
  file_extension: 'fileExtension',
  filename: 'filename',
  is_active: 'isActive',
  is_archived: 'isArchived',
  is_deleted: 'isDeleted',
  is_editable: 'isEditable',
  label: 'label',
  last_modifier: 'lastModifier',
  modified: 'modified',
  parent: 'parent',
  parents: 'parents',
  score: 'score',
  show_in_ui: 'showInUi',
  slug: 'slug',
  status: 'status',
  sub_content_types: 'subContentTypes',
  workspace: 'workspace',
  workspace_id: 'workspaceId'
}

const defaultResult = {
  currentNumberPage: 1,
  numberResultsByPage: NUMBER_RESULTS_BY_PAGE,
  searchedKeywords: '',
  resultList: []
}

function searchResult (searchType = 'simple', state = defaultResult, action) {
  let newResultList, uniqueResultList
  switch (action.type) {
    case `${SET}/${SEARCH_RESULTS_LIST(searchType)}`:
      newResultList = action.newSearchResultList.map(item => serialize(item, serializeSearchItemProps))
      uniqueResultList = uniqBy(newResultList, 'contentId')
      return { ...state, resultList: uniqueResultList }

    case `${REMOVE}/${WORKSPACE_CONTENT}`:
    case `${UPDATE}/${WORKSPACE_CONTENT}`:
      newResultList = []
      state.resultList.forEach(searchResultItem => action.workspaceContentList.forEach(content => {
        // INFO - GB - 2020-06-23 - Update if one of the content received in the action is the content at the resultList
        if (searchResultItem.contentId === content.content_id) {
          newResultList = [...newResultList, { ...searchResultItem, ...serialize(content, serializeSearchItemProps) }]
        } else {
          // INFO - GB - 2020-06-23 - Or update if it's one of the content's parents
          if (searchResultItem.parents.some(parent => parent.content_id === content.content_id)) {
            newResultList = [...newResultList, {
              ...searchResultItem,
              parents: searchResultItem.parents.map(parent => parent.content_id === content.content_id ? content : parent)
            }]
          } else newResultList = [...newResultList, searchResultItem]
        }
      }))
      uniqueResultList = uniqBy(newResultList, 'contentId')
      return { ...state, resultList: uniqueResultList }

    case `${APPEND}/${SEARCH_RESULTS_LIST(searchType)}`:
      newResultList = action.appendSearchResultList.map(item => serialize(item, serializeSearchItemProps))
      uniqueResultList = uniqBy([...state.resultList, ...newResultList], 'contentId')
      return { ...state, resultList: uniqueResultList }

    case `${SET}/${SEARCHED_KEYWORDS}`:
      return { ...state, searchedKeywords: action.searchedKeywords }

    case `${SET}/${SEARCH_RESULTS_BY_PAGE}`:
      return { ...state, numberResultsByPage: action.numberResultsByPage }

    case `${SET}/${SEARCH_CURRENT_PAGE(searchType)}`:
      return { ...state, currentNumberPage: action.currentNumberPage }

    case `${UPDATE}/${WORKSPACE_DETAIL}`:
      newResultList = state.resultList.map(item =>
        action.workspaceDetail.workspace_id === item.workspaceId
          ? { ...item, workspace: { ...item.workspace, label: action.workspaceDetail.label } }
          : item
      )
      return { ...state, resultList: newResultList }

    default:
      return state
  }
}

export default function searchResultWrapper (searchType) {
  return (state, action) => searchResult(searchType, state, action)
}
