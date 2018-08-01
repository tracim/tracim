import {SET, WORKSPACE_DETAIL, WORKSPACE_MEMBER_LIST} from '../action-creator.sync.js'
import { handleRouteFromApi } from '../helper.js'

const defaultWorkspace = {
  id: 0,
  slug: '',
  label: '',
  description: '',
  sidebarEntries: [],
  member: []
}

export default function currentWorkspace (state = defaultWorkspace, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_DETAIL}`:
      return {
        ...state,
        id: action.workspaceDetail.workspace_id,
        slug: action.workspaceDetail.slug,
        label: action.workspaceDetail.label,
        description: action.workspaceDetail.description,
        sidebarEntries: action.workspaceDetail.sidebar_entries.map(sbe => ({
          slug: sbe.slug,
          route: handleRouteFromApi(sbe.route),
          faIcon: sbe.fa_icon,
          hexcolor: sbe.hexcolor,
          label: sbe.label
        }))
      }

    case `${SET}/${WORKSPACE_MEMBER_LIST}`:
      return {
        ...state,
        member: action.workspaceMemberList.map(m => ({
          id: m.user_id,
          publicName: m.user.public_name,
          avatarUrl: m.user.avatar_url,
          role: m.role,
          isActive: m.is_active,
        }))
      }

    default:
      return state
  }
}
