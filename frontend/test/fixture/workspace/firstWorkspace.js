import { appListAsSidebarEntry } from '../../hocMock/redux/appList/appListAsSidebarEntry.js'
import { globalManagerAsMember } from '../user/globalManagerAsMember.js'
import { serializeWorkspace } from '../../../src/reducer/currentWorkspace.js'

export const firstWorkspaceFromApi = {
  workspace_id: 1,
  label: 'First workspace',
  slug: 'first-workspace',
  description: 'first workspace description',
  sidebar_entries: appListAsSidebarEntry(1),
  agenda_enabled: true,
  public_download_enabled: true,
  public_upload_enabled: true,
  is_deleted: false,
  created: '2019-03-24T08:58:57Z'
}

export const firstWorkspace = {
  ...serializeWorkspace(firstWorkspaceFromApi),
  isOpenInSidebar: false,
  sidebarEntryList: appListAsSidebarEntry(1),
  memberList: [globalManagerAsMember]
}
// export const firstWorkspace = {
//   id: 1,
//   label: 'First workspace',
//   slug: 'first-workspace',
//   description: 'first workspace description',
//   sidebarEntryList: appListAsSidebarEntry(1),
//   isOpenInSidebar: false,
//   agendaEnabled: true,
//   memberList: [globalManagerAsMember]
// }
