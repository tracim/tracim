import { defaultDebug } from 'tracim_frontend_lib'

export const debug = {
  ...defaultDebug,
  config: {
    ...defaultDebug.config,
    slug: 'kanban',
    faIcon: 'fas fa-columns',
    hexcolor: '#197474',
    creationLabel: 'Start a topic',
    label: 'Kanban',
    workspace: {
      downloadEnabled: true
    }
  },
  content: {
    ...defaultDebug.content,
    content_id: 1,
    content_type: 'kanban',
    workspace_id: 1
  }
}
