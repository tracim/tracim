const nock = require('nock')

const mockGetThreadContent200 = (apiUrl, workspaceId, contentId, content) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/threads/${contentId}`)
    .reply(200, content)
}

const mockPutMyselfThreadRead200 = (apiUrl, userId, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/users/${userId}/workspaces/${workspaceId}/contents/${contentId}/read`)
    .reply(200)
}

const mockGetThreadRevision200 = (apiUrl, workspaceId, contentId, revisionList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/threads/${contentId}/revisions`)
    .reply(200, revisionList)
}

const mockGetThreadComment200 = (apiUrl, workspaceId, contentId, commentList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents/${contentId}/comments`)
    .reply(200, commentList)
}

export {
  mockGetThreadContent200,
  mockGetThreadComment200,
  mockGetThreadRevision200,
  mockPutMyselfThreadRead200
}
