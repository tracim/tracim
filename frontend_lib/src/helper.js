import i18n from './i18n.js'
import color from 'color'
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

export const addAllResourceI18n = (i18n, translation) => {
  Object.keys(translation).forEach(lang =>
    Object.keys(translation[lang]).forEach(namespace =>
      i18n.addResources(lang, namespace, translation[lang][namespace])
    )
  )
}

// @deprecated Côme - 2018/28/11 - this function is deprecated, you must use the component Avatar from tracim_frotnend_lib
export const generateAvatarFromPublicName = publicName => {
  // code from https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
  const stringToHashCode = str => str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)

  const intToRGB = i => {
    const c = (i & 0x00FFFFFF).toString(16).toUpperCase()
    return '00000'.substring(0, 6 - c.length) + c
  }

  const hexcolor = '#' + intToRGB(stringToHashCode(publicName))

  let canvas = document.createElement('canvas')

  // http://code.google.com/p/explorercanvas/wiki/Instructions#Dynamically_created_elements
  if (!canvas.getContext) G_vmlCanvasManager.initElement(canvas)

  let ctx = canvas.getContext('2d')
  canvas.width = 44
  canvas.height = 44

  const { r, g, b } = color(hexcolor).desaturate(0.75).rgb()

  ctx.beginPath()
  ctx.arc(22, 22, 20, 0, 2 * Math.PI, false)
  ctx.fillStyle = 'rgba(' + [r, g, b, 1].join() + ')'
  ctx.fill()
  ctx.stroke()

  return canvas.toDataURL('image/png', '')
}

export const displayDistanceDate = (dateToDisplay, lang) => distanceInWords(new Date(), dateToDisplay, {locale: dateFnsLocale[lang], addSuffix: true})

export const convertBackslashNToBr = msg => msg.replace(/\n/g, '<br />')

export const revisionTypeList = lang => {
  i18n.changeLanguage(lang)
  return [{
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
}
