import {
  APPEND,
  APPLIED_FILTER,
  NEWEST_AUTHORED_CONTENT_RANGE,
  CREATED_RANGE,
  MODIFIED_RANGE,
  REMOVE,
  RESET,
  SEARCH_FACETS,
  SEARCH_CONTENT_BREADCRUMBS,
  SEARCH_RESULTS_LIST,
  SEARCHED_STRING,
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
import { ADVANCED_SEARCH_TYPE, SEARCH_TYPE } from '../util/helper.js'

export const serializeSearchItemProps = {
  access_type: 'accessType',
  author: 'author',
  comment_count: 'commentCount',
  content_count: 'contentCount',
  content_id: 'contentId',
  content_type: 'contentType',
  created: 'created',
  current_revision_id: 'currentRevisionId',
  current_revision_type: 'currentRevisionType',
  file_extension: 'fileExtension',
  filename: 'filename',
  has_avatar: 'hasAvatar',
  has_cover: 'hasCover',
  is_active: 'isActive',
  is_archived: 'isArchived',
  is_deleted: 'isDeleted',
  is_editable: 'isEditable',
  label: 'label',
  last_modifier: 'lastModifier',
  member_count: 'memberCount',
  modified: 'modified',
  parent: 'parent',
  parents: 'parents',
  path: 'path',
  public_name: 'publicName',
  score: 'score',
  show_in_ui: 'showInUi',
  slug: 'slug',
  status: 'status',
  sub_content_types: 'subContentTypes',
  user_id: 'userId',
  username: 'username',
  workspace: 'workspace',
  workspace_id: 'workspaceId'
}

const defaultResult = {
  appliedFilters: {
    searchFieldList: []
  },
  createdRange: {},
  newestAuthoredContentRange: {},
  currentPage: 1,
  dateRangeFacets: {},
  modifiedRange: {},
  numberResultsByPage: NUMBER_RESULTS_BY_PAGE,
  searchFacets: {},
  searchString: '',
  resultList: []
}

function getUniqueResultList (searchType, resultList) {
  switch (searchType) {
    case ADVANCED_SEARCH_TYPE.SPACE:
      return uniqBy(resultList, 'workspaceId')
    case ADVANCED_SEARCH_TYPE.USER:
      return uniqBy(resultList, 'userId')
    default:
      return uniqBy(resultList, 'contentId')
  }
}

function searchResult (searchType = SEARCH_TYPE.SIMPLE, state = defaultResult, action) {
  let newResultList, uniqueResultList
  switch (action.type) {
    case `${SET}/${SEARCH_RESULTS_LIST(searchType)}`:
      newResultList = action.newSearchResultList.map(item => serialize(item, serializeSearchItemProps))
      uniqueResultList = getUniqueResultList(searchType, newResultList)
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
      uniqueResultList = getUniqueResultList(searchType, [...state.resultList, ...newResultList])
      return { ...state, resultList: uniqueResultList }

    case `${SET}/${SEARCH_CONTENT_BREADCRUMBS(searchType)}`:
      newResultList = state.resultList.map(result =>
        result.contentId === action.contentId
          ? {
            ...result,
            breadcrumbsList: action.contentBreadcrumbsList
          }
          : result
      )
      return { ...state, resultList: newResultList }

    case `${SET}/${SEARCHED_STRING}`:
      return { ...state, searchString: action.searchString }

    case `${SET}/${SEARCH_FACETS(searchType)}`:
      return { ...state, searchFacets: action.searchFacets }

    case `${SET}/${NEWEST_AUTHORED_CONTENT_RANGE(searchType)}`:
      return { ...state, newestAuthoredContentRange: action.newestAuthoredContentRange }

    case `${SET}/${CREATED_RANGE(searchType)}`:
      return { ...state, createdRange: action.createdRange }

    case `${SET}/${MODIFIED_RANGE(searchType)}`:
      return { ...state, modifiedRange: action.modifiedRange }

    case `${SET}/${SEARCH_RESULTS_BY_PAGE}`:
      return { ...state, numberResultsByPage: action.numberResultsByPage }

    case `${SET}/${SEARCH_CURRENT_PAGE(searchType)}`:
      return { ...state, currentPage: action.currentPage }

    case `${SET}/${APPLIED_FILTER(searchType)}`:
      return { ...state, appliedFilters: { ...state.appliedFilters, [action.key]: action.value } }

    case `${RESET}/${APPLIED_FILTER(searchType)}`:
      return { ...state, appliedFilters: defaultResult.appliedFilters }

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

export default function searchResultWrapper (searchType = SEARCH_TYPE.SIMPLE) {
  return (state = defaultResult, action) => searchResult(searchType, state, action)
}
