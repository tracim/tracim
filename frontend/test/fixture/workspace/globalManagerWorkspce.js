import { globalManagerFromApi } from '../user/globalManagerFromApi.js'
import { firstWorkspaceFromApi } from './firstWorkspace.js'

export const globalManagerWorkspaceFromApi = {
  email_notification_type: 'summary',
  role: 'workspace-manager',
  user_id: globalManagerFromApi.user_id,
  workspace_id: firstWorkspaceFromApi.workspace_id,
  user: globalManagerFromApi,
  workspace: firstWorkspaceFromApi
}
