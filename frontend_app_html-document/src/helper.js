import { APP_FEATURE_MODE } from 'tracim_frontend_lib'

export const initWysiwyg = (state, lang, handlerNewComment, handlerNewVersion) => {
  if (state.timelineWysiwyg) {
    tinymce.remove('#wysiwygTimelineComment')
    wysiwyg('#wysiwygTimelineComment', lang, handlerNewComment)
  }
  if (state.mode === APP_FEATURE_MODE.EDIT) {
    tinymce.remove('#wysiwygNewVersion')
    wysiwyg('#wysiwygNewVersion', lang, handlerNewVersion)
  }
}
