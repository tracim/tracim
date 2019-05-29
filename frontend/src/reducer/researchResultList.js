import {
  SET,
  RESET,
  APPEND,
  RESEARCH,
  RESEARCH_ELEMENTS,
  STRING_RESEARCH,
  RESEARCH_ELEMENTS_BY_PAGE,
  RESEARCH_PAGE
} from '../action-creator.sync.js'

const defaultResultList = {
  number_page: 1,
  number_elements_by_page: 10,
  total_elements: -1,
  string_research: '',
  result_list: []
}
export default function researchResultList (state = defaultResultList, action) {
  switch (action.type) {
    case `${SET}/${RESEARCH}`:
      return {...state, result_list: action.newResearch}

    case `${APPEND}/${RESEARCH}`:
      return {...state, result_list: [...state.result_list, ...action.appendResearch]}

    case `${RESET}/${RESEARCH}`:
      return defaultResultList

    case `${SET}/${STRING_RESEARCH}`:
      return {...state, string_research: action.strResearch}

    case `${SET}/${RESEARCH_ELEMENTS}`:
      return {...state, total_elements: action.nbElements}

    case `${SET}/${RESEARCH_ELEMENTS_BY_PAGE}`:
      return {...state, number_elements_by_page: action.nbElementsByPage}

    case `${SET}/${RESEARCH_PAGE}`:
      return {...state, number_page: action.nbPage}

    default:
      return state
  }
}
