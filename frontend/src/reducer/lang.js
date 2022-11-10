import { UPDATE, LANG } from '../action-creator.sync.js'

const defaultLang = [{
  id: 'de',
  label: 'Deutsch'
}, {
  id: 'en',
  label: 'English'
}, {
  id: 'es',
  label: 'Español'
}, {
  id: 'fr',
  label: 'Français'
}, {
  id: 'nb_NO',
  label: 'Norsk'
}, {
  id: 'pt',
  label: 'Português'
}, {
  id: 'ar',
  label: 'العربية'
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
