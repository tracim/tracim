import {
  SET,
  APPEND,
  SEARCH_RESULTS_LIST,
  SEARCHED_KEYWORDS,
  SEARCH_RESULTS_BY_PAGE,
  SEARCH_CURRENT_PAGE,
  UPDATE
} from '../action-creator.sync.js'
import { uniqBy } from 'lodash'
import { serialize } from 'tracim_frontend_lib'

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
  parent_id: 'parentId',
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
  numberResultsByPage: 10,
  searchedKeywords: '',
  resultsList: []
}

function uniqueResults (allResults) {
  return uniqBy(allResults, 'contentId')
}

export default function searchResult (state = defaultResult, action) {
  switch (action.type) {
    case `${SET}/${SEARCH_RESULTS_LIST}`:
      return {
        ...state,
        resultsList: uniqueResults((action.newSearchResultsList).map(item => serialize(item, serializeSearchItemProps)))
      }

    case `${UPDATE}/${SEARCH_RESULTS_LIST}`:
      return {
        ...state,
        resultsList: uniqueResults((state.resultsList).map(item => item.contentId === action.searchResultItem.content_id
          ? { ...item, ...serialize(action.searchResultItem, serializeSearchItemProps) }
          : item
        ))
      }

    case `${APPEND}/${SEARCH_RESULTS_LIST}`:
      return {
        ...state,
        resultsList: uniqueResults([...state.resultsList, ...((action.newSearchResultsList).map(item => serialize(item, serializeSearchItemProps)))])
      }

    case `${SET}/${SEARCHED_KEYWORDS}`:
      return { ...state, searchedKeywords: action.searchedKeywords }

    case `${SET}/${SEARCH_RESULTS_BY_PAGE}`:
      return { ...state, numberResultsByPage: action.numberResultsByPage }

    case `${SET}/${SEARCH_CURRENT_PAGE}`:
      return { ...state, currentNumberPage: action.currentNumberPage }

    default:
      return state
  }
}
