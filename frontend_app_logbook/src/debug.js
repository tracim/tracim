import { defaultDebug } from 'tracim_frontend_lib'

export const debug = {
  ...defaultDebug,
  config: {
    ...defaultDebug.config,
    slug: 'logbook',
    faIcon: 'fas fa-sort-numeric-up',
    hexcolor: '#ff4081',
    creationLabel: 'Start a logbook',
    label: 'Logbook',
    workspace: {
      downloadEnabled: true
    }
  },
  content: {
    ...defaultDebug.content,
    content_id: 3,
    content_type: 'logbook',
    workspace_id: 1
  },
  workspaceId: 1
}
