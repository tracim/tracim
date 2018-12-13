import i18n from './i18n.js'
import { distanceInWords } from 'date-fns'
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

export const handleFetchResult = async fetchResult => {
  switch (fetchResult.status) {
    case 204: return fetchResult
    case 401:
      GLOBAL_dispatchEvent({type: 'disconnectedFromApi', date: {}})
      return generateFetchResponse(fetchResult)
    case 500:
      GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: i18n.t('Unexpected error, please inform an administrator'),
          type: 'danger',
          delay: undefined
        }
      })
      return generateFetchResponse(fetchResult)
    default:
      return generateFetchResponse(fetchResult)
  }
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
  label: i18n.t('New status')
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

export const generateLocalStorageContentId = (idWorkspace, idContent, typeContent, dataType) => `${idWorkspace}/${idContent}/${typeContent}_${dataType}`
