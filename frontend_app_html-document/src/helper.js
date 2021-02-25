import { APP_FEATURE_MODE } from 'tracim_frontend_lib'

export const initWysiwyg = (
  state,
  lang,
  handlerNewVersion,
  handleTinyMceInput,
  handleTinyMceKeyDown,
  handleTinyMceKeyUp,
  handleTinyMceSelectionChange
) => {
  if (state.mode === APP_FEATURE_MODE.EDIT) {
    globalThis.tinymce.remove('#wysiwygNewVersion')
    globalThis.wysiwyg('#wysiwygNewVersion', lang, handlerNewVersion, handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange)
  }
}

export const TRANSLATION_STATE = {
  UNTRANSLATED: 'untranslated',
  PENDING: 'pending',
  TRANSLATED: 'translated'
}
