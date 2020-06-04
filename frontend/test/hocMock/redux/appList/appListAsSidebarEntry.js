import { appList } from './appList.js'
import { file } from '../../../fixture/app/file.js'
import { htmlDocument } from '../../../fixture/app/htmlDocument.js'
import { thread } from '../../../fixture/app/thread.js'
import { agenda } from '../../../fixture/app/agenda.js'
import { serializeSidebarEntry } from '../../../../src/reducer/currentWorkspace.js'

export const sidebarEntryDashboardFromApi = {
  slug: 'dashboard',
  route: '/ui/workspaces/1/dashboard',
  fa_icon: 'home',
  hexcolor: '#fdfdfd',
  label: 'Dashboard'
}
export const sidebarEntryAllContentFromApi = {
  slug: 'contents/all',
  route: '/ui/workspaces/1/contents',
  fa_icon: 'th',
  hexcolor: '#bbbbbb',
  label: 'All Contents'
}
export const appListAsSidebarEntry = workspaceId => [
  serializeSidebarEntry(sidebarEntryDashboardFromApi),
  serializeSidebarEntry(sidebarEntryAllContentFromApi),
  ...appList
    .filter(app => [htmlDocument.slug, thread.slug, file.slug, agenda.slug].includes(app.slug))
    .map(({ slug, faIcon, hexcolor, label }) => ({
      slug,
      faIcon,
      hexcolor,
      label,
      route: `/ui/workspaces/${workspaceId}/contents?type=${slug}`
    }))
]
