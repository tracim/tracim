export const removeExtensionOfFilename = filename => filename.split('.').splice(0, (filename.split('.').length - 1)).join('.')

export const PAGE = {
  WORKSPACE: {
    CONTENT: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}`,
    CONTENT_EDITION: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}/online_edition`
  },
  ONLINE_EDITION: (contentId) => `/api/collaborative-document-edition/wopi/files/${contentId}`
}

export const DISALLOWED_VIDEO_MIME_TYPE_LIST = [
  // INFO - CH - 2020-06-11 - put mime types that you don't handle here
  // example 'video/webm',
]

export const isVideoMimeTypeAndIsAllowed = (mimeType, disallowedMimeTypeList) => {
  if (!mimeType || !mimeType.startsWith('video/')) return false
  return !disallowedMimeTypeList.includes(mimeType)
}
