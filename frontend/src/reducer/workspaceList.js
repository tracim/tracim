import {
  SET,
  UPDATE,
  USER_WORKSPACE_DO_NOTIFY,
  WORKSPACE_LIST,
  WORKSPACE_LIST_MEMBER
} from '../action-creator.sync.js'

export function workspaceList (state = [], action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_LIST}`:
      return action.workspaceList.map(ws => ({
        id: ws.workspace_id,
        label: ws.label,
        slug: ws.slug,
        // description: ws.description, // not returned by /api/v2/users/:idUser/workspaces
        sidebarEntry: ws.sidebar_entries.map(sbe => ({
          slug: sbe.slug,
          route: sbe.route,
          faIcon: sbe.fa_icon,
          hexcolor: sbe.hexcolor,
          label: sbe.label
        })),
        isOpenInSidebar: ws.isOpenInSidebar,
        agendaEnabled: ws.agenda_enabled,
        memberList: []
      }))

    case `${SET}/${WORKSPACE_LIST}/isOpenInSidebar`:
      return state.map(ws => ({...ws, isOpenInSidebar: ws.id === action.workspaceId ? action.isOpenInSidebar : ws.isOpenInSidebar}))

    case `${SET}/${WORKSPACE_LIST_MEMBER}`:
      return state.map(ws => ({
        ...ws,
        memberList: action.workspaceListMemberList.find(wlml => wlml.idWorkspace === ws.id).memberList.map(m => ({
          id: m.user_id,
          publicName: m.user.public_name,
          role: m.role,
          isActive: m.is_active,
          doNotify: m.do_notify
        }))
      }))

    case `${UPDATE}/${USER_WORKSPACE_DO_NOTIFY}`:
      return state.map(ws => ws.id === action.idWorkspace
        ? {
          ...ws,
          memberList: ws.memberList.map(u => u.id === action.idUser
            ? {...u, doNotify: action.doNotify}
            : u
          )
        }
        : ws
      )

    default:
      return state
  }
}

export default workspaceList
