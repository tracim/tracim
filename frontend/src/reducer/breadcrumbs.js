import {
  SET,
  PREPEND,
  APPEND,
  BREADCRUMBS
} from '../action-creator.sync.js'

/*
Breadcrumbs item:
{
  url: '/home',
  label: props.t('Home'),
  type: [CORE, APPFEATURE, APPFULLSCREEN]
*/
const BREADCRUMBS_TYPE_ORDER = [{
  id: 'CORE',
  order: 1
}, {
  id: 'APPFULLSCREEN',
  order: 2
}, {
  id: 'APPFEATURE',
  order: 4
}]

const orderBreadcrumbs = breadcrumbsList => {
  if (breadcrumbsList.some(bc => !BREADCRUMBS_TYPE_ORDER.map(bc => bc.id).includes(bc.type))) {
    console.warn('Error, encountered an invalid breadcrumbs element. Breadcrumbs list: ', breadcrumbsList)
    return breadcrumbsList
  }

  return breadcrumbsList.sort((a, b) => a.order < b.order)
}

export function breadcrumbs (state = [], action) {
  switch (action.type) {
    case `${SET}/${BREADCRUMBS}`:
      return orderBreadcrumbs(action.newBreadcrumbs)

    case `${PREPEND}/${BREADCRUMBS}`:
      return orderBreadcrumbs([...action.prependBreadcrumbs, ...state])

    case `${APPEND}/${BREADCRUMBS}`:
      return orderBreadcrumbs([
        // INFO - CH - 2019-04-16 - app features cannot set breadcrums from root so it needs to overrides itself every time
        ...state.filter(bc => bc.type !== 'APPFEATURE'),
        ...action.appendBreadcrumbs
      ])

    default:
      return state
  }
}

export default breadcrumbs
