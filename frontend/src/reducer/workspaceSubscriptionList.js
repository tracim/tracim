import {
  WORKSPACE_SUBSCRIPTION_LIST,
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
      return action.subscriptionList.map(ws => serialize(ws, serializeWorkspaceSubscriptionListProps))
    case `${ADD}/${WORKSPACE_SUBSCRIPTION_LIST}`:
      return [
        ...state,
        action.subscription
      ]
    case `${REMOVE}/${WORKSPACE_SUBSCRIPTION_LIST}`:
      return state.filter(subscription => subscription.workspace.workspace_id !== action.subscription.workspace_id)
    default:
      return state
  }
}

export default workspaceSubscriptionList
