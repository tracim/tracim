export const removeExtensionOfFilename = filename => filename.split('.').splice(0, (filename.split('.').length - 1)).join('.')

export const PAGE = {
  WORKSPACE: {
    CONTENT: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}`,
    CONTENT_EDITION: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}/online_edition`
  },
  ONLINE_EDITION: (contentId) => `/api/v2/collaborative-document-edition/wopi/files/${contentId}`
}

export const IMG_LOAD_STATE = {
  LOADED: 'loaded',
  LOADING: 'loading',
  ERROR: 'error'
}
