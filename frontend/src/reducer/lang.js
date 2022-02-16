import { UPDATE, LANG } from '../action-creator.sync.js'

const defaultLang = [{
  id: 'en',
  label: 'English'
}, {
  id: 'fr',
  label: 'Français'
}, {
  id: 'pt',
  label: 'Português'
}, {
  id: 'de',
  label: 'Deutsch'
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
