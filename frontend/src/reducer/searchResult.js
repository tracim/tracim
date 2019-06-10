import {
  SET,
  RESET,
  APPEND,
  SEARCH_RESULTS_LIST,
  CURRENT_NUMBER_SEARCH_RESULTS,
  SEARCHED_KEYWORDS,
  SEARCH_RESULTS_BY_PAGE,
  SEARCH_CURRENT_PAGE,
  SEARCH
} from '../action-creator.sync.js'

const defaultResult = {
  currentNumberPage: 1,
  numberResultsByPage: 10,
  currentNumberSearchResults: 0,
  searchedKeywords: '',
  resultsList: []
}

export default function searchResult (state = defaultResult, action) {
  switch (action.type) {
    case `${SET}/${SEARCH_RESULTS_LIST}`:
      return {...state, resultsList: action.newSearchResultsList}

    case `${APPEND}/${SEARCH_RESULTS_LIST}`:
      return {...state, resultsList: [...state.resultsList, ...action.appendSearchResultsList]}

    case `${RESET}/${SEARCH}`:
      return defaultResult

    case `${SET}/${SEARCHED_KEYWORDS}`:
      return {...state, searchedKeywords: action.searchedKeywords}

    case `${SET}/${CURRENT_NUMBER_SEARCH_RESULTS}`:
      return {...state, currentNumberSearchResults: action.currentNumberSearchResults}

    case `${SET}/${SEARCH_RESULTS_BY_PAGE}`:
      return {...state, numberResultsByPage: action.numberResultsByPage}

    case `${SET}/${SEARCH_CURRENT_PAGE}`:
      return {...state, currentNumberPage: action.currentNumberPage}

    default:
      return state
  }
}
