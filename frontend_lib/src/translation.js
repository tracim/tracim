import i18n from 'i18next'

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
