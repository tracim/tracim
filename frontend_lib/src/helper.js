import React from 'react'
import i18n from './i18n.js'
import { distanceInWords } from 'date-fns'
import ErrorFlashMessageTemplateHtml from './component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'
import { CUSTOM_EVENT } from './customEvent.js'

var dateFnsLocale = {
  fr: require('date-fns/locale/fr'),
  en: require('date-fns/locale/en')
}

export const generateFetchResponse = async fetchResult => {
  const resultJson = await fetchResult.clone().json()
  return new Promise((resolve, reject) => resolve({
    apiResponse: fetchResult,
    body: resultJson
  }))
}

export const errorFlashMessageTemplateObject = errorMsg => ({
  type: CUSTOM_EVENT.ADD_FLASH_MSG,
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
    GLOBAL_dispatchEvent({type: CUSTOM_EVENT.DISCONNECTED_FROM_API, date: {}})
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
    const event = new CustomEvent(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, {detail: {type: CUSTOM_EVENT.RELOAD_CONTENT(appName), data: newContent}})
    document.dispatchEvent(event)
    return false
  }
  return true
}

// INFO - GB - 2019-07-05 - This password generetor function was based on
// https://stackoverflow.com/questions/5840577/jquery-or-javascript-password-generator-with-at-least-a-capital-and-a-number
export const generateRandomPassword = () => {
  let password = []
  let charCode = String.fromCharCode
  let randomNumber = Math.random
  let random, i

  for (i = 0; i < 10; i++) { // password with a size 10
    random = 0 | randomNumber() * 62 // generate upper OR lower OR number
    password.push(charCode(48 + random + (random > 9 ? 7 : 0) + (random > 35 ? 6 : 0)))
  }
  let randomPassword = password.sort(() => { return randomNumber() - 0.5 }).join('')

  return randomPassword
}

export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const displayFileSize = (bytes, decimals) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals <= 0 ? 0 : decimals || 2
  const sizes = [i18n.t('Bytes'), i18n.t('KB'), i18n.t('MB'), i18n.t('GB'), i18n.t('TB'), i18n.t('PB'), i18n.t('EB'), i18n.t('ZB'), i18n.t('YB')]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const parserStringToList = (string, separatorList = [',', ';', '\n']) => {
  let parsedString = string
  separatorList.forEach(separator => {
    parsedString = parsedString.split(separator).join(',')
  })
  return parsedString.split(',').filter(notEmptyString => notEmptyString !== '')
}

// INFO - GB - 2019-07-31 - This function check if the email has three parts arranged like somethig@something.somethig
export const checkEmailValidity = email => {
  const parts = email.split('@')
  if (parts.length !== 2) return false

  const domainParts = parts[1].split('.')
  return domainParts.length === 2
}

export const getFilePreviewUrl = (apiUrl, workspaceId, contentId, revisionId, filenameNoExtension, page, width, height) =>
  `${apiUrl}/workspaces/${workspaceId}/files/${contentId}/revisions/${revisionId}/preview/jpg/${width}x${height}/${filenameNoExtension + '.jpg'}?page=${page}`
