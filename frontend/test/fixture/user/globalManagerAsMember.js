import { globalManager } from './globalManager.js'
import { ROLE } from 'tracim_frontend_lib'

const { id, publicName, isActive, doNotify } = globalManager

// INFO - CH - 2019-06-24 - this is a user returned by the api as a member of a workspace
export const globalManagerAsMember = {
  id,
  publicName,
  isActive,
  doNotify,
  role: ROLE.workspaceManager.id
}
