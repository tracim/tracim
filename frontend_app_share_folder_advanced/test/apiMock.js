const nock = require('nock')

const mockGetContentTypeList200 = (apiUrl, contentTypes) => {
  return nock(apiUrl)
    .get('/system/content_types')
    .reply(200, contentTypes)
}

const mockGetImportAuthorizationsList200 = (apiUrl, workspaceId, uploadPermissions) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/upload_permissions`)
    .reply(200, uploadPermissions)
}

export {
  mockGetImportAuthorizationsList200,
  mockGetContentTypeList200
}
