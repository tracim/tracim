import {globalManager} from './globalManager.js'
import {ROLE_OBJECT} from '../../../src/helper.js'

const {id, publicName, isActive, doNotify} = globalManager

// INFO - CH - 2019-06-24 - this is a user returned by the api as a member of a workspace
export const globalManagerAsMember = {
  id,
  publicName,
  isActive,
  doNotify,
  role: ROLE_OBJECT.workspaceManager.id
}
