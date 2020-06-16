import React from 'react'
import { connect } from 'react-redux'
import {
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST,
} from 'tracim_frontend_lib'
import {
  addWorkspaceContentList,
  addWorkspaceMember,
  removeWorkspaceMember,
  removeWorkspaceReadStatus,
  updateWorkspaceContentList,
  updateWorkspaceMember
} from '../action-creator.sync.js'

export class ReduxTlmDispatcher extends React.Component {
  constructor (props) {
    super(props)

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleMemberDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCreatedComment },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentModified }
      // FIXME - CH - 2020-05-18 - need core event type undelete to handle this
      // { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, handler: this.handleContentDeleted }
    ])
  }

  handleMemberCreated = data => {
    this.props.dispatch(addWorkspaceMember(data.user, data.workspace, data.member))
  }

  handleMemberModified = data => {
    this.props.dispatch(updateWorkspaceMember(data.user, data.workspace, data.member))
  }

  handleMemberDeleted = data => {
    if (this.props.currentWorkspace.id !== data.workspace.workspace_id) return
    this.props.dispatch(removeWorkspaceMember(data.user.user_id, data.workspace))
    // above update currentWorkspace. Todo: update workspaceList
  }

  handleContentCreated = data => {
    if (this.props.currentWorkspace.id !== data.workspace.workspace_id) return
    this.props.dispatch(addWorkspaceContentList([data.content]))
    // above update currentWorkspace. Todo: update workspaceList
  }

  handleContentCreatedComment = data => {
    if (this.props.currentWorkspace.id !== data.workspace.workspace_id) return
    this.props.dispatch(removeWorkspaceReadStatus(data.content.parent_id))
    // above update currentWorkspace. Todo: update workspaceList
  }

  handleContentModified = data => {
    if (this.props.currentWorkspace.id !== data.workspace.workspace_id) return
    this.props.dispatch(updateWorkspaceContentList([data.content]))
    // above update currentWorkspace. Todo: update workspaceList
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ currentWorkspace }) => { currentWorkspace }
export default connect(mapStateToProps)(TracimComponent(ReduxTlmDispatcher))
