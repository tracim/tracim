const nock = require('nock')

const mockPutMyselfFileRead200 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/users/me/workspaces/${workspaceId}/contents/${contentId}/read`)
    .reply(200)
}

const mockGetFileRevision200 = (apiUrl, workspaceId, contentId, revisionList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/files/${contentId}/revisions`)
    .reply(200, revisionList)
}

const mockGetShareLinksList200 = (apiUrl, workspaceId, contentId, shareList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents/${contentId}/shares`)
    .reply(200, shareList)
}

const mockGetFileComment200 = (apiUrl, workspaceId, contentId, commentList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents/${contentId}/comments`)
    .reply(200, commentList)
}

const mockGetFileContent200 = (apiUrl, workspaceId, contentId, content) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/files/${contentId}`)
    .reply(200, content)
}

const mockPutUserConfiguration204 = (apiUrl, userId) => {
  return nock(apiUrl)
    .put(`/users/${userId}/config`)
    .reply(204)
}

export {
  mockGetFileContent200,
  mockGetFileComment200,
  mockGetShareLinksList200,
  mockGetFileRevision200,
  mockPutMyselfFileRead200,
  mockPutUserConfiguration204
}
