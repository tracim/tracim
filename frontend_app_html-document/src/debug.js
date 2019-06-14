import { defaultDebug } from 'tracim_frontend_lib'

export const debug = {
  config: {
    ...defaultDebug.config,
    slug: 'html-document',
    faIcon: 'file-text-o',
    hexcolor: '#00CC00',
    creationLabel: 'Write a document',
    label: 'Text Document'
  },
  content: {
    ...defaultDebug.content,
    content_id: 1,
    content_type: 'html-document',
    workspace_id: 2
  },
  loggedUser: {
    ...defaultDebug.loggedUser
  }
}
