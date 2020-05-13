import { APP_FEATURE_MODE } from 'tracim_frontend_lib'

export const initWysiwyg = (state, lang, handlerNewComment, handlerNewVersion) => {
  if (state.timelineWysiwyg) {
    globalThis.tinymce.remove('#wysiwygTimelineComment')
    globalThis.wysiwyg('#wysiwygTimelineComment', lang, handlerNewComment)
  }
  if (state.mode === APP_FEATURE_MODE.EDIT) {
    globalThis.tinymce.remove('#wysiwygNewVersion')
    globalThis.wysiwyg('#wysiwygNewVersion', lang, handlerNewVersion)
  }
}
