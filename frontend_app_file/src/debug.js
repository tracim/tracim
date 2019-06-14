import { defaultDebug } from 'tracim_frontend_lib'

export const debug = {
  config: {
    ...defaultDebug.config,
    slug: 'file',
    faIcon: 'paperclip',
    hexcolor: '#ffa500',
    creationLabel: 'Upload a file',
    label: 'File'
  },
  content: {
    ...defaultDebug.content,
    content_id: 27,
    content_type: 'file',
    workspace_id: 5
  },
  loggedUser: {
    ...defaultDebug.loggedUser
  }
}
