import i18n from './i18n.js'
import color from 'color'
import moment from 'moment'

export const libHandleFetchResult = async fetchResult => {
  switch (fetchResult.status) {
    case 200:
    case 304:
      const resultJson = await fetchResult.clone().json()
      return new Promise((resolve, reject) => resolve({
        apiResponse: fetchResult,
        body: resultJson
      }))
    case 204:
      return fetchResult
    case 400:
    case 404:
    case 409:
    case 500:
    case 501:
    case 502:
    case 503:
    case 504:
      return new Promise((resolve, reject) => reject(fetchResult)) // @TODO : handle errors from api result
  }
}

export const libAddAllResourceI18n = (i18n, translation) => {
  Object.keys(translation).forEach(lang =>
    Object.keys(translation[lang]).forEach(namespace =>
      i18n.addResources(lang, namespace, translation[lang][namespace])
    )
  )
}

export const libGenerateAvatarFromPublicName = publicName => {
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

export const libDisplayDate = (dateToDisplay, lang) => {
  i18n.changeLanguage(lang)

  const todayMoment = moment(new Date())
  const dateToDisplayMoment = moment(new Date(dateToDisplay))

  const diffDay = todayMoment.diff(dateToDisplayMoment, 'days')
  if (diffDay > 0) return i18n.t('{{nb}} days ago', {nb: diffDay})

  const diffHour = todayMoment.diff(dateToDisplayMoment, 'hours')
  if (diffHour > 0) return i18n.t('{{nb}} hours ago', {nb: diffHour})

  const diffMinute = todayMoment.diff(dateToDisplayMoment, 'minutes')
  if (diffMinute > 0) return i18n.t('{{nb}} minutes ago', {nb: diffMinute})

  const diffSeconde = todayMoment.diff(dateToDisplayMoment, 'seconds')
  return i18n.t('{{nb}} seconds ago', {nb: diffSeconde})
}

export const libConvertBackslashNToBr = msg => msg.replace(/\n/g, '<br />')
