import DRAW from './images/libreoffice_icons/draw.png'
import CALC from './images/libreoffice_icons/spreadsheet.png'
import WRITER from './images/libreoffice_icons/text.png'
import IMPRESS from './images/libreoffice_icons/presentation.png'

export const FILE_TYPES = {
  collabora: {
    spreadsheet: {
      ext: 'ods',
      img: CALC
    },
    text: {
      ext: 'odt',
      img: WRITER
    },
    presentation: {
      ext: 'odp',
      img: IMPRESS
    },
    draw: {
      ext: 'odg',
      img: DRAW
    }
  },
  other: {
    spreadsheet: 'ods',
    text: 'odt',
    presentation: 'odp',
    draw: 'odg'
  }
}

export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const getTemplateFromFileType = (editor, type, availableTemplates) => {
  const editorSupportedTypes = FILE_TYPES[editor] ? FILE_TYPES[editor] : {}
  const extension = editorSupportedTypes[type] ? editorSupportedTypes[type].ext : 'notAnExtension'
  const template = availableTemplates.filter((template) => template.endsWith(extension))
  return template.length === 1 ? template[0] : null
}

export const getEditorTypesAsList = (editor) => {
  return FILE_TYPES[editor] ? Object.keys(FILE_TYPES[editor]) : []
}

export const getAvaibleTypes = (editor, availableTemplates) => {
  return getEditorTypesAsList(editor).filter((type) => getTemplateFromFileType(editor, type, availableTemplates) !== null)
}

export const getIconUrlFromType = (editor, type) => {
  const editorSupportedTypes = FILE_TYPES[editor] ? FILE_TYPES[editor] : {}
  return editorSupportedTypes[type] ? editorSupportedTypes[type].img : null
}
