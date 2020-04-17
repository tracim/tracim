import { UPDATE, LANG } from '../action-creator.sync.js'
import flagEn from '../img/flag_en.png'
import flagFr from '../img/flag_fr.png'
import flagPt from '../img/flag_pt.png'

const defaultLang = [{
  id: 'en',
  label: 'English',
  icon: flagEn
}, {
  id: 'fr',
  label: 'Français',
  icon: flagFr
}, {
  id: 'pt',
  label: 'Português',
  icon: flagPt
}]

export function lang (state = defaultLang, action) {
  switch (action.type) {
    case `${UPDATE}/${LANG}`:
      return action.langList

    default:
      return state
  }
}

export default lang
