import { setupCommonRequestHeaders } from './helper.js'

/**
 * Create a File upload object from a File() object
 * @param file a File object
 * @param errorMessage optional initial error message
 * @return a file upload object, containing the needed information for uploading the file
 */
export const createFileUpload = (file, errorMessage = '') => {
  return {
    file: file,
    errorMessage: errorMessage,
    progress: 0,
    responseStatus: null,
    responseJson: null
  }
}

/**
 * Upload a File object to a given URL.
 * The upload is done using a FormData() object.
 * @param fileUpload file upload object as created by createFileUpload()
 * @param uploadUrl URL where to upload the given file
 * @param httpMethod HTTP method to use in the request
 * @param progressEventHandler handler that will be called on XHR progress event with (event, fileUpload)
 * @param errorMessageList list of error message objects used to create errors messages for HTTP status/API error codes
 The error message objects shall have a {status,code,message} structure.
 * @param additionalFormData object with data that will be added to the FormData()
 * @return a new file upload object with filled response fields.
 */
export const uploadFile = async (
  fileUpload,
  uploadUrl,
  {
    httpMethod = 'POST',
    progressEventHandler = null,
    errorMessageList = [],
    additionalFormData = {},
    defaultErrorMessage = 'Error while uploading file'
  }
) => {
  // INFO - CH - 2018-08-28 - fetch still doesn't handle event progress. So we need to use old school xhr object
  const xhr = new XMLHttpRequest()
  const formData = new FormData()
  formData.append('files', fileUpload.file)
  for (const entry of Object.entries(additionalFormData)) {
    formData.append(entry[0], entry[1])
  }
  if (progressEventHandler) xhr.upload.addEventListener('progress', e => progressEventHandler(e, fileUpload), false)

  xhr.open(httpMethod, uploadUrl, true)
  setupCommonRequestHeaders(xhr)
  xhr.withCredentials = true

  let errorMessage = ''
  try {
    await new Promise((resolve, reject) => {
      xhr.onerror = () => reject(new Error())
      xhr.onload = resolve
      xhr.send(formData)
    })
  } catch {
    errorMessage = defaultErrorMessage
  }
  let responseJson
  try {
    responseJson = JSON.parse(xhr.responseText)
  } catch {}

  if (xhr.status >= 400) {
    const errorMessageObject = errorMessageList.find(m => m.status === xhr.status && m.code === responseJson.code)
    errorMessage = errorMessageObject ? errorMessageObject.message : defaultErrorMessage
  }

  return {
    ...fileUpload,
    errorMessage: errorMessage,
    responseJson: responseJson,
    responseStatus: xhr.status
  }
}

export const isFileUploadInList = (fileUpload, fileUploadList) => {
  return fileUploadList.some(fu => fu.file.name === fileUpload.file.name)
}

export const isFileUploadInErrorState = (fileUpload) => {
  return fileUpload.responseStatus >= 400 || fileUpload.errorMessage.length > 0
}
