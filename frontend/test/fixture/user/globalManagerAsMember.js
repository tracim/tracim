import { globalManagerFromApi } from './globalManagerFromApi.js'
import { ROLE } from 'tracim_frontend_lib'
import { serializeRole } from '../../../src/reducer/currentWorkspace.js'

export const globalManagerAsMemberFromApi = {
  user: {
    ...globalManagerFromApi
  },
  role: ROLE.workspaceManager.slug,
  is_active: true,
  email_notification_type: 'summary'
}

export const globalManagerAsMember = serializeRole(globalManagerAsMemberFromApi)
