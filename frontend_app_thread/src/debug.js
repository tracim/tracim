import { defaultDebug } from 'tracim_frontend_lib'

export const debug = {
  config: {
    ...defaultDebug.config,
    slug: 'thread',
    faIcon: 'comments-o',
    hexcolor: '#428BCA',
    creationLabel: 'Start a topic',
    label: 'Thread'
  },
  content: {
    ...defaultDebug.content,
    content_id: 23,
    content_type: 'thread',
    workspace_id: 5
  },
  loggedUser: {
    ...defaultDebug.loggedUser
  }
}
