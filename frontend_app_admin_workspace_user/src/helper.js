export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const debug = {
  config: {
    label: 'Admin workspace user',
    slug: 'admin_workspace_user',
    faIcon: 'file-text-o',
    hexcolor: '#7d4e24',
    type: 'workspace'
  },
  loggedUser: { // @FIXME this object is outdated
    user_id: 5,
    username: 'Smoi',
    firstname: 'Côme',
    lastname: 'Stoilenom',
    email: 'osef@algoo.fr',
    lang: 'en',
    avatar_url: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4',
    auth: btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`)
  },
  content: {
    author: {
      avatar_url: null,
      public_name: 'Global manager',
      user_id: 1 // -1 or 1 for debug
    },
    content_id: 22, // 1 or 22 for debug
    content_type: 'html-document',
    created: '2018-06-18T14:59:26Z',
    current_revision_id: 11,
    is_archived: false,
    is_deleted: false,
    label: 'Current Menu',
    last_modifier: {
      avatar_url: null,
      public_name: 'Global manager',
      user_id: 1
    },
    modified: '2018-06-18T14:59:26Z',
    parent_id: 2,
    raw_content: '<div>bonjour, je suis un lapin.</div>',
    show_in_ui: true,
    slug: 'current-menu',
    status: 'open',
    sub_content_types: ['thread', 'html-document', 'file', 'folder'],
    workspace_id: 1
  }
}
