import { content } from './fixture/content.js'
import { author } from './fixture/author.js'

const nock = require('nock')

const mockPutContent200 = (apiUrl, workspaceId, contentId, appSlug, newLabel, newRawContent) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/${appSlug}s/${contentId}`, {
      label: newLabel,
      raw_content: newRawContent
    })
    .reply(200, {
      ...content,
      label: newLabel,
      raw_content: newRawContent
    })
}

const mockPostContentComment200 = (apiUrl, workspaceId, contentId, newComment) => {
  return nock(apiUrl)
    .post(`/workspaces/${workspaceId}/contents/${contentId}/comments`, {
      raw_content: newComment
    })
    .reply(200, {
      author: author,
      content_id: 42,
      created: '2020-01-07T15:57:43.417Z',
      parent_id: 32,
      raw_content: newComment
    })
}

const mockPutContentStatus204 = (apiUrl, workspaceId, contentId, appSlug, newStatusSlug) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/${appSlug}s/${contentId}/status`, {
      status: newStatusSlug
    })
    .reply(204, '')
}

const mockPutContentArchive204 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/contents/${contentId}/archived`)
    .reply(204, '')
}

const mockPutContentDelete204 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/contents/${contentId}/trashed`)
    .reply(204, '')
}

const mockPutContentArchiveRestore204 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/contents/${contentId}/archived/restore`)
    .reply(204, '')
}

const mockPutContentDeleteRestore204 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/contents/${contentId}/trashed/restore`)
    .reply(204, '')
}

export {
  mockPutContent200,
  mockPostContentComment200,
  mockPutContentStatus204,
  mockPutContentArchive204,
  mockPutContentDelete204,
  mockPutContentArchiveRestore204,
  mockPutContentDeleteRestore204
}
