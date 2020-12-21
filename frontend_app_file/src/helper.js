export const removeExtensionOfFilename = filename => filename.split('.').splice(0, (filename.split('.').length - 1)).join('.')

export const DISALLOWED_VIDEO_MIME_TYPE_LIST = [
  // INFO - CH - 2020-06-11 - put mime types that you don't handle here
  // example 'video/webm',
]

export const isVideoMimeTypeAndIsAllowed = (mimeType, disallowedMimeTypeList) => {
  if (!mimeType || !mimeType.startsWith('video/')) return false
  return !disallowedMimeTypeList.includes(mimeType)
}
