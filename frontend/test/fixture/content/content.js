import { serializeContent } from '../../../src/reducer/workspaceContentList.js'

export const contentFromApi = {
  slug: 'test-content-html',
  modified: '2019-05-25T10:17:37Z',
  content_namespace: 'content',
  author: {
    avatar_url: null,
    public_name: 'User2',
    user_id: 2
  },
  current_revision_id: 42,
  is_editable: true,
  created: '2019-05-25T10:17:37Z',
  status: 'open',
  show_in_ui: true,
  file_extension: '.document.html',
  is_deleted: false,
  filename: 'test_content_html.document.html',
  raw_content: '',
  last_modifier: {
    avatar_url: null,
    public_name: 'User2',
    user_id: 2
  },
  sub_content_types: [
    'comment'
  ],
  content_type: 'html-document',
  parent_id: null,
  label: 'Test content html',
  is_archived: false,
  actives_shares: 0,
  workspace_id: 1,
  content_id: 12
}

export const content = serializeContent(contentFromApi)
