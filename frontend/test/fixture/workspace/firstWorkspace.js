import { appListAsSidebarEntry } from '../../hocMock/redux/appList/appListAsSidebarEntry.js'
import { globalManagerAsMemberFromApi } from '../user/globalManagerAsMember.js'
import { serializeWorkspace } from '../../../src/reducer/currentWorkspace.js'

export const firstWorkspaceFromApi = {
  access_type: 'open',
  default_user_role: 'reader',
  workspace_id: 1,
  label: 'First workspace',
  slug: 'first-workspace',
  description: 'first workspace description',
  sidebar_entries: appListAsSidebarEntry(1),
  agenda_enabled: true,
  public_download_enabled: true,
  public_upload_enabled: true,
  is_deleted: false,
  created: '2019-03-24T08:58:57Z',
  publication_enabled: true,
  members: [globalManagerAsMemberFromApi]
}

export const firstWorkspace = {
  ...serializeWorkspace(firstWorkspaceFromApi),
  sidebarEntryList: appListAsSidebarEntry(1),
  contentReadStatusList: []
}
