import React from 'react'
import i18n from './i18n.js'
import { distanceInWords } from 'date-fns'
import ErrorFlashMessageTemplateHtml from './component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'

var dateFnsLocale = {
  fr: require('date-fns/locale/fr'),
  en: require('date-fns/locale/en')
}

const generateFetchResponse = async fetchResult => {
  const resultJson = await fetchResult.clone().json()
  return new Promise((resolve, reject) => resolve({
    apiResponse: fetchResult,
    body: resultJson
  }))
}

const errorFlashMessageTemplateObject = errorMsg => ({
  type: 'addFlashMsg',
  data: {
    msg: <ErrorFlashMessageTemplateHtml errorMsg={errorMsg} />,
    type: 'danger',
    delay: 30000
  }
})

export const handleFetchResult = async fetchResult => {
  const status = fetchResult.status

  if (status === 204) return fetchResult // no result
  if (status >= 200 && status <= 299) return generateFetchResponse(fetchResult)
  if (status >= 300 && status <= 399) return generateFetchResponse(fetchResult)
  if (status === 401) { // unauthorized
    GLOBAL_dispatchEvent({type: 'disconnectedFromApi', date: {}})
    return generateFetchResponse(fetchResult)
  }
  if (status >= 400 && status <= 499) return generateFetchResponse(fetchResult) // let specific handler handle it with fetchResult.body.code
  if (status >= 500 && status <= 599) {
    GLOBAL_dispatchEvent(errorFlashMessageTemplateObject(`Unexpected api error with http status ${status}`)) // no need for translation
    return generateFetchResponse(fetchResult)
  }

  GLOBAL_dispatchEvent(errorFlashMessageTemplateObject(`Unknown http status ${status}`)) // no need for translation
  return generateFetchResponse(fetchResult)
}

export const addAllResourceI18n = (i18nFromApp, translation, activeLang) => {
  Object.keys(translation).forEach(lang =>
    Object.keys(translation[lang]).forEach(namespace =>
      i18nFromApp.addResources(lang, namespace, translation[lang][namespace])
    )
  )
  i18n.changeLanguage(activeLang) // set frontend_lib's i18n on app mount
}

export const displayDistanceDate = (dateToDisplay, lang) => distanceInWords(new Date(), dateToDisplay, {locale: dateFnsLocale[lang], addSuffix: true})

export const convertBackslashNToBr = msg => msg.replace(/\n/g, '<br />')

export const BREADCRUMBS_TYPE = {
  CORE: 'CORE',
  APP_FULLSCREEN: 'APP_FULLSCREEN',
  APP_FEATURE: 'APP_FEATURE'
}

export const revisionTypeList = [{
  id: 'archiving',
  faIcon: 'archive',
  label: i18n.t('Item archived')
}, {
  id: 'content-comment',
  faIcon: 'comment-o',
  label: i18n.t('Comment')
}, {
  id: 'creation',
  faIcon: 'magic',
  label: i18n.t('Item created')
}, {
  id: 'deletion',
  faIcon: 'trash',
  label: i18n.t('Item deleted')
}, {
  id: 'edition',
  faIcon: 'edit',
  label: i18n.t('New revision')
}, {
  id: 'revision',
  faIcon: 'history',
  label: i18n.t('New revision')
}, {
  id: 'status-update',
  faIcon: 'random',
  label: statusLabel => i18n.t('Status changed to {{status}}', {status: statusLabel})
}, {
  id: 'unarchiving',
  faIcon: 'file-archive-o',
  label: i18n.t('Item unarchived')
}, {
  id: 'undeletion',
  faIcon: 'trash-o',
  label: i18n.t('Item restored')
}, {
  id: 'move',
  faIcon: 'arrows',
  label: i18n.t('Item moved')
}, {
  id: 'copy',
  faIcon: 'files-o',
  label: i18n.t('Item copied')
}]

export const generateLocalStorageContentId = (workspaceId, contentId, contentType, dataType) => `${workspaceId}/${contentId}/${contentType}_${dataType}`

export const appFeatureCustomEventHandlerShowApp = (newContent, currentContentId, appName) => {
  if (newContent.content_id !== currentContentId) {
    const event = new CustomEvent('appCustomEvent', {detail: {type: `${appName}_reloadContent`, data: newContent}})
    document.dispatchEvent(event)
    return false
  }
  return true
}
