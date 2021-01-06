import { appList } from './appList.js'
import { file } from '../../../fixture/app/file.js'
import { htmlDocument } from '../../../fixture/app/htmlDocument.js'
import { thread } from '../../../fixture/app/thread.js'
import { agenda } from '../../../fixture/app/agenda.js'
import { serializeSidebarEntryProps } from '../../../../src/reducer/currentWorkspace.js'
import { serialize } from 'tracim_frontend_lib'

export const sidebarEntryDashboardFromApi = {
  slug: 'dashboard',
  route: '/ui/workspaces/1/dashboard',
  fa_icon: 'tachometer',
  hexcolor: '#fdfdfd',
  label: 'Dashboard'
}
export const sidebarEntryAllContentFromApi = {
  slug: 'contents/all',
  route: '/ui/workspaces/1/contents',
  fa_icon: 'th',
  hexcolor: '#bbbbbb',
  label: 'Contents'
}
export const appListAsSidebarEntry = workspaceId => [
  serialize(sidebarEntryDashboardFromApi, serializeSidebarEntryProps),
  serialize(sidebarEntryAllContentFromApi, serializeSidebarEntryProps),
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
