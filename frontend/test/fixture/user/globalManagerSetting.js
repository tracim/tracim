import { ROLE } from 'tracim_frontend_lib'

export const globalManagerSetting = {
  role: ROLE.workspaceManager.slug,
  email_notification_type: 'summary'
}

export const globalManagerSettingUpdated = {
  role: ROLE.reader.slug,
  email_notification_type: 'summary'
}
