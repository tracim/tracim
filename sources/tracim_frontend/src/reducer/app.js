import { APP_LIST } from '../action-creator.sync.js'

export default function app (state = [], action) {
  switch (action.type) {
    case `Set/${APP_LIST}`:
      return action.appList.map(a => ({
        label: a.label,
        slug: a.slug,
        isActive: a.is_active,
        faIcon: a.fa_icon,
        hexcolor: a.hexcolor,
        config: a.config
      }))

    default:
      return state
  }
}
