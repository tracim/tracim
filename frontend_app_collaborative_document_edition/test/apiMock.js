const nock = require('nock')

const mockGetCollaborativeDocumentTemplates200 = (apiUrl) => {
  return nock(apiUrl)
    .get('/collaborative-document-edition/templates')
    .reply(200, {
      file_templates: ['default.odp', 'default.ods', 'default.odt']
    })
}

const mockGetFile200 = (apiUrl, workspaceId, contentId, contentToReturn) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/files/${contentId}`)
    .reply(200, contentToReturn)
}

export {
  mockGetCollaborativeDocumentTemplates200,
  mockGetFile200
}
