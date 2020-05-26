import { globalManager } from './globalManager.js'
import { ROLE } from 'tracim_frontend_lib'
import { serializeMember } from '../../../src/reducer/currentWorkspace.js'

const globalManagerAsMemberFromApi = {
  user: {
    ...globalManager
  },
  role: ROLE.workspaceManager.slug,
  is_active: true,
  do_notify: true
}

export const globalManagerAsMember = serializeMember(globalManagerAsMemberFromApi)
