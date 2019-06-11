import {
  SET,
  RESET,
  APPEND,
  RESEARCH,
  RESEARCH_ELEMENTS,
  KEY_WORD_RESEARCH,
  RESEARCH_ELEMENTS_BY_PAGE,
  RESEARCH_PAGE
} from '../action-creator.sync.js'

const defaultResult = {
  numberPage: 1,
  numberElementsByPage: 10,
  totalElements: 0,
  keyWordResearch: '',
  resultList: []
}
export default function researchResult (state = defaultResult, action) {
  switch (action.type) {
    case `${SET}/${RESEARCH}`:
      return {...state, resultList: action.newResearch}

    case `${APPEND}/${RESEARCH}`:
      return {...state, resultList: [...state.resultList, ...action.appendResearch]}

    case `${RESET}/${RESEARCH}`:
      return defaultResult

    case `${SET}/${KEY_WORD_RESEARCH}`:
      return {...state, keyWordResearch: action.keyWordResearch}

    case `${SET}/${RESEARCH_ELEMENTS}`:
      return {...state, totalElements: action.nbElements}

    case `${SET}/${RESEARCH_ELEMENTS_BY_PAGE}`:
      return {...state, numberElementsByPage: action.nbElementsByPage}

    case `${SET}/${RESEARCH_PAGE}`:
      return {...state, numberPage: action.nbPage}

    default:
      return state
  }
}
