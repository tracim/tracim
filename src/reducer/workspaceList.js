import {
  WORKSPACE_LIST,
  USER_ROLE
} from '../action-creator.sync.js'

const serializeWorkspaceItem = data => ({
  id: data.id,
  title: data.title,
  role: data.role,
  notif: data.notif
})

export function workspaceList (state = [], action) {
  switch (action.type) {
    case `Update/${WORKSPACE_LIST}`:
      return action.workspaceList.map(ws => ({
        ...serializeWorkspaceItem(ws),
        isOpenInSidebar: false
      }))

    case `Set/${WORKSPACE_LIST}/isOpenInSidebar`:
      return state.map(ws => ws.id === action.workspaceId
        ? {...ws, isOpenInSidebar: action.isOpenInSidebar}
        : ws
      )

    case `Set/${USER_ROLE}`:
      return state.map(ws => {
        const foundWorkspace = action.userRole.find(r => ws.id === r.workspace.id) || {role: '', subscribed_to_notif: ''}
        return {
          ...ws,
          role: foundWorkspace.role,
          notif: foundWorkspace.subscribed_to_notif
        }
      })

    case `Update/${USER_ROLE}/SubscriptionNotif`:
      return state.map(ws => ws.id === action.workspaceId
        ? {...ws, notif: action.subscriptionNotif}
        : ws
      )

    default:
      return state
  }
}

export default workspaceList
