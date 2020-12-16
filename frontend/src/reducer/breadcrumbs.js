import {
  SET,
  PREPEND,
  APPEND,
  BREADCRUMBS,
  RESET,
  APP_FEATURE
} from '../action-creator.sync.js'
import { BREADCRUMBS_TYPE } from 'tracim_frontend_lib'

const BREADCRUMBS_TYPE_ORDER = [{
  id: BREADCRUMBS_TYPE.CORE,
  order: 1
}, {
  id: BREADCRUMBS_TYPE.APP_FULLSCREEN,
  order: 2
}, {
  id: BREADCRUMBS_TYPE.APP_FEATURE,
  order: 4
}]

const orderBreadcrumbs = crumbList => {
  if (crumbList.some(crumb => !BREADCRUMBS_TYPE_ORDER.map(crumb => crumb.id).includes(crumb.type))) {
    console.warn('Error, encountered an invalid breadcrumbs element. Breadcrumbs list: ', crumbList)
    return crumbList
  }

  return crumbList.sort((a, b) => a.order - b.order)
}

export function breadcrumbs (state = [], action) {
  switch (action.type) {
    case `${SET}/${BREADCRUMBS}`:
      return orderBreadcrumbs(action.newBreadcrumbs)

    case `${PREPEND}/${BREADCRUMBS}`:
      return orderBreadcrumbs([...action.prependBreadcrumbs, ...state])

    case `${APPEND}/${BREADCRUMBS}`:
      return orderBreadcrumbs([
        // INFO - CH - 2019-04-16 - app features cannot set breadcrumbs from root so it needs to overrides itself every time
        ...state.filter(crumb => crumb.type !== BREADCRUMBS_TYPE.APP_FEATURE),
        ...action.appendBreadcrumbs
      ])

    case `${RESET}/${BREADCRUMBS}/${APP_FEATURE}`:
      return state.filter(crumb => crumb.type !== BREADCRUMBS_TYPE.APP_FEATURE)

    default:
      return state
  }
}

export default breadcrumbs
