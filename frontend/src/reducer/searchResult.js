import {
  SET,
  APPEND,
  SEARCH_RESULTS_LIST,
  SEARCHED_KEYWORDS,
  SEARCH_RESULTS_BY_PAGE,
  SEARCH_CURRENT_PAGE
} from '../action-creator.sync.js'
import { uniqBy } from 'lodash'

const defaultResult = {
  currentNumberPage: 1,
  numberResultsByPage: 10,
  searchedKeywords: '',
  resultsList: []
}

function uniqueResults (allResults) {
  return uniqBy(allResults, 'content_id')
}

export default function searchResult (state = defaultResult, action) {
  switch (action.type) {
    case `${SET}/${SEARCH_RESULTS_LIST}`:
      return { ...state, resultsList: uniqueResults(action.newSearchResultsList) }

    case `${APPEND}/${SEARCH_RESULTS_LIST}`:
      return { ...state, resultsList: uniqueResults([...state.resultsList, ...action.appendSearchResultsList]) }

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
