import { LANG } from '../action-creator.sync.js'
import flagEn from '../img/flag_en.png'
import flagFr from '../img/flag_fr.png'

const defaultLang = [{
  id: 'en',
  icon: flagEn
}, {
  id: 'fr',
  icon: flagFr
}]

export function lang (state = defaultLang, action) {
  switch (action.type) {
    case `Update/${LANG}`:
      return action.langList

    // Côme - 2018/07/30 - deprecated, lang active is saved in user reducer
    // case `Set/${LANG}/Active`:
    //   return state.map(l => ({...l, active: l.id === action.langId}))

    default:
      return state
  }
}

export default lang
