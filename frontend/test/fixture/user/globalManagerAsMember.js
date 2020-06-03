import { globalManagerFromApi } from './globalManagerFromApi.js'
import { ROLE } from 'tracim_frontend_lib'
import { serializeMember } from '../../../src/reducer/currentWorkspace.js'

export const globalManagerAsMemberFromApi = {
  user: {
    ...globalManagerFromApi
  },
  role: ROLE.workspaceManager.slug,
  is_active: true,
  do_notify: true
}

export const globalManagerAsMember = serializeMember(globalManagerAsMemberFromApi)
