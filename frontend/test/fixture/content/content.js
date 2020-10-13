import { serializeContentProps } from '../../../src/reducer/workspaceContentList.js'
import { serialize } from 'tracim_frontend_lib'

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
  current_revision_type: 'edition',
  is_editable: true,
  created: '2019-05-25T10:17:37Z',
  status: 'open',
  show_in_ui: true,
  file_extension: '.document.html',
  is_deleted: false,
  isOpen: false,
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
  parent_content_type: '',
  parent_label: '',
  parent_id: null,
  label: 'Test content html',
  is_archived: false,
  actives_shares: 0,
  workspace_id: 1,
  content_id: 12
}

export const content = serialize(contentFromApi, serializeContentProps)

export const contentFolder = {
  parentId: null,
  slug: 'move-destination',
  workspaceId: 7,
  type: 'folder',
  showInUi: true,
  id: 20,
  isDeleted: false,
  fileExtension: '',
  created: '2020-07-01T08:35:29Z',
  fileName: 'move destination',
  statusSlug: 'open',
  label: 'move destination',
  activedShares: 0,
  subContentTypeList: [
    'thread',
    'file',
    'html-document',
    'folder',
    'comment'
  ],
  isArchived: false,
  isOpen: true
}
