export const MODE = {
  VIEW: 'view',
  EDIT: 'edit',
  REVISION: 'revision'
}

export const initWysiwyg = (state, lang, handlerNewComment, handlerNewVersion) => {
  if (state.timelineWysiwyg) {
    tinymce.remove('#wysiwygTimelineComment')
    wysiwyg('#wysiwygTimelineComment', lang, handlerNewComment)
  }
  if (state.mode === MODE.EDIT) {
    tinymce.remove('#wysiwygNewVersion')
    wysiwyg('#wysiwygNewVersion', lang, handlerNewVersion)
  }
}
