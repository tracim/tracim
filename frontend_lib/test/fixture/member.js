import { user } from './user.js'
import { workspace } from './workspace.js'

export const member = {
  email_notification_type: 'summary',
  is_active: true,
  role: 'workspace-manager',
  user: user,
  user_id: user.user_id,
  workspace: workspace,
  workspace_id: workspace.workspace_id
}
