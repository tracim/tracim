const nock = require('nock')

const mockGetSystemContentTypes200 = (apiUrl, contentTypes) => {
  return nock(apiUrl)
    .get('/system/content_types')
    .reply(200, contentTypes)
}

const mockGetFolder200 = (apiUrl, workspaceId, folderId, folder) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/folders/${folderId}`)
    .reply(200, folder)
}

export {
  mockGetSystemContentTypes200,
  mockGetFolder200
}
