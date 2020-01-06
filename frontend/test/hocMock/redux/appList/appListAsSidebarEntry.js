import { appList } from './appList.js'
import { file } from '../../../fixture/app/file.js'
import { htmlDocument } from '../../../fixture/app/htmlDocument.js'
import { thread } from '../../../fixture/app/thread.js'
import { agenda } from '../../../fixture/app/agenda.js'

export const appListAsSidebarEntry = workspaceId => [{
  slug: 'dashboard',
  route: `/ui/workspaces/${workspaceId}/dashboard`,
  faIcon: 'home',
  hexcolor: '#fdfdfd',
  label: 'Dashboard'
}, {
  slug: 'contents/all',
  route: `/ui/workspaces/${workspaceId}/contents`,
  faIcon: 'th',
  hexcolor: '#bbbbbb',
  label: 'All Contents'
},
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
