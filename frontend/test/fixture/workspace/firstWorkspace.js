import {appListAsSidebarEntry} from '../../hocMock/redux/appList/appListAsSidebarEntry.js'
import {globalManagerAsMember} from '../user/globalManagerAsMember.js'

export const firstWorkspace = {
  id: 1,
  label: 'First workspace',
  slug: 'first-workspace',
  sidebarEntry: appListAsSidebarEntry(1),
  isOpenInSidebar: false,
  agendaEnabled: true,
  memberList: [globalManagerAsMember]
}
