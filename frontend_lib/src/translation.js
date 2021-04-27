import i18n from 'i18next'
import { getHtmlDocTranslated, getCommentTranslated } from './action.async.js'
import { sendGlobalFlashMessage } from './helper.js'

export const TRANSLATION_STATE = {
  DISABLED: 'disabled',
  UNTRANSLATED: 'untranslated',
  PENDING: 'pending',
  TRANSLATED: 'translated'
}

export const getTranslationApiErrorMessage = (response) => {
  const errors = [
    { status: 502, message: i18n.t('Translation is not available') },
    { status: 504, message: i18n.t('Translation is not available') }
  ]
  if (!response.ok) {
    const error = errors.find(e => e.status === response.status) || { status: null, message: i18n.t('Unknown error') }
    return i18n.t(
      'Error while translating the document: {{details}}',
      { details: error.message }
    )
  }
  return null
}

export const getDefaultTranslationState = (config) => {
  return config.translation_service__enabled
    ? TRANSLATION_STATE.UNTRANSLATED
    : TRANSLATION_STATE.DISABLED
}

const handleTranslateResponse = async (response, config, setState) => {
  const errorMessage = getTranslationApiErrorMessage(response)
  if (errorMessage) {
    sendGlobalFlashMessage(errorMessage)
    setState({ translationState: getDefaultTranslationState(config) })
    return
  }
  const translatedRawContent = await response.text()
  setState({ translatedRawContent, translationState: TRANSLATION_STATE.TRANSLATED })
}

export const handleTranslateHtmlContent = async (apiUrl, workspaceId, contentId, revisionId, lang, config, setState) => {
  setState({ translationState: TRANSLATION_STATE.PENDING })
  const response = await getHtmlDocTranslated(apiUrl, workspaceId, contentId, revisionId, lang)
  handleTranslateResponse(response, config, setState)
}

export const handleTranslateComment = async (apiUrl, workspaceId, parentContentId, commentContentId, lang, config, setState) => {
  setState({ translationState: TRANSLATION_STATE.PENDING })
  const response = await getCommentTranslated(apiUrl, workspaceId, parentContentId, commentContentId, lang)
  handleTranslateResponse(response, config, setState)
}
