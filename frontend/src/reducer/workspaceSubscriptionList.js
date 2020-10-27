import {
  WORKSPACE_SUBSCRIPTION_LIST,
  WORKSPACE_SUBSCRIPTION,
  ADD,
  REMOVE,
  SET,
  UPDATE
} from '../action-creator.sync.js'
import { serialize } from 'tracim_frontend_lib'

export const serializeWorkspaceSubscriptionListProps = {
  author: 'author',
  createdDate: 'created_date',
  evaluationDate: 'evaluation_date',
  evaluator: 'evaluator',
  state: 'state',
  workspace: 'workspace'
}

const workspaceSubscriptionList = (state = [], action) => {
  switch (action.type) {
    case `${SET}/${WORKSPACE_SUBSCRIPTION_LIST}`:
      return action.subscriptionList.map(s => serialize(s, serializeWorkspaceSubscriptionListProps))
    case `${ADD}/${WORKSPACE_SUBSCRIPTION}`:
      return [
        ...state,
        serialize(action.subscription, serializeWorkspaceSubscriptionListProps)
      ]
    case `${REMOVE}/${WORKSPACE_SUBSCRIPTION}`:
      return state.filter(s => s.workspace.workspace_id !== action.subscription.workspace.workspace_id)
    case `${UPDATE}/${WORKSPACE_SUBSCRIPTION}`:
      return [
        ...state.filter(s => s.workspace.workspace_id !== action.subscription.workspace.workspace_id),
        serialize(action.subscription, serializeWorkspaceSubscriptionListProps)
      ]
    default:
      return state
  }
}

export default workspaceSubscriptionList
