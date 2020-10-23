import {
  WORKSPACE_SUBSCRIPTION_LIST,
  WORKSPACE_SUBSCRIPTION,
  ADD,
  REMOVE,
  SET
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
        action.subscription
      ]
    case `${REMOVE}/${WORKSPACE_SUBSCRIPTION}`:
      return state.filter(s => s.workspace.workspace_id !== action.subscription.workspace.workspace_id)
    default:
      return state
  }
}

export default workspaceSubscriptionList
