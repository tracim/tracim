const nock = require('nock')

const mockPutHtmlDocumentRead200 = (userId, apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/users/${userId}/workspaces/${workspaceId}/contents/${contentId}/read`)
    .reply(200)
}

const mockPutUserConfiguration204 = (apiUrl, userId) => {
  return nock(apiUrl)
    .put(`/users/${userId}/config`)
    .reply(204)
}

const mockGetHtmlDocumentRevision200 = (apiUrl, workspaceId, contentId, revisionList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/html-documents/${contentId}/revisions`)
    .reply(200, revisionList)
}

const mockGetHtmlDocumentComment200 = (apiUrl, workspaceId, contentId, commentList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents/${contentId}/comments`)
    .reply(200, commentList)
}

const mockGetHtmlDocumentContent200 = (apiUrl, workspaceId, contentId, content) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/html-documents/${contentId}`)
    .reply(200, content)
}

export {
  mockGetHtmlDocumentContent200,
  mockGetHtmlDocumentComment200,
  mockGetHtmlDocumentRevision200,
  mockPutHtmlDocumentRead200,
  mockPutUserConfiguration204
}
