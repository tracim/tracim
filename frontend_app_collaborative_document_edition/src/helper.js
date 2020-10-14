import i18n from './i18n.js'
import DRAW from './images/libreoffice_icons/draw.png'
import CALC from './images/libreoffice_icons/spreadsheet.png'
import WRITER from './images/libreoffice_icons/text.png'
import IMPRESS from './images/libreoffice_icons/presentation.png'

export const FILE_TYPES = {
  collabora: {
    spreadsheet: {
      ext: '.ods',
      img: CALC,
      translation: i18n.t('Spreadsheet')
    },
    text: {
      ext: '.odt',
      img: WRITER,
      translation: i18n.t('Text')
    },
    presentation: {
      ext: '.odp',
      img: IMPRESS,
      translation: i18n.t('Presentation')
    },
    draw: {
      ext: '.odg',
      img: DRAW,
      translation: i18n.t('Draw')
    }
  }
}

export const PAGE = {
  WORKSPACE: {
    CONTENT: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}`
  },
  ONLINE_EDITION: (contentId) => `/api/collaborative-document-edition/wopi/files/${contentId}`
}

export const getTemplateFromFileType = (software, fileType, availableTemplates) => {
  const softwareSupportedFileTypes = FILE_TYPES[software] || {}
  const extension = softwareSupportedFileTypes[fileType] ? softwareSupportedFileTypes[fileType].ext : 'notAnExtension'
  const template = availableTemplates.filter((template) => template.endsWith(extension))
  return template.length === 1 ? template[0] : null
}

export const getTranslationFromFileType = (software, fileType) => {
  const softwareSupportedFileTypes = FILE_TYPES[software] || {}
  return softwareSupportedFileTypes[fileType] ? softwareSupportedFileTypes[fileType].translation : ''
}

export const getExtensionFromFileType = (software, fileType) => {
  const softwareSupportedFileTypes = FILE_TYPES[software] || {}
  return softwareSupportedFileTypes[fileType] ? softwareSupportedFileTypes[fileType].ext : ''
}

export const getSoftwareFileTypesAsList = (software) => {
  return FILE_TYPES[software] ? Object.keys(FILE_TYPES[software]) : []
}

export const getAvaibleFileTypes = (software, availableTemplates) => {
  return getSoftwareFileTypesAsList(software).filter(
    (fileType) => getTemplateFromFileType(software, fileType, availableTemplates) !== null
  )
}

export const getIconUrlFromFileType = (software, fileType) => {
  const softwareSupportedFileTypes = FILE_TYPES[software] || {}
  return softwareSupportedFileTypes[fileType] ? softwareSupportedFileTypes[fileType].img : null
}
