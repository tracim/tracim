import React from 'react'
import { connect } from 'react-redux'
import {
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST
} from 'tracim_frontend_lib'
import {
  addWorkspaceContentList,
  addWorkspaceMember,
  deleteWorkspaceContentList,
  removeWorkspaceMember,
  removeWorkspaceReadStatus,
  unDeleteWorkspaceContentList,
  updateUser,
  updateWorkspaceContentList,
  updateWorkspaceDetail,
  updateWorkspaceMember
} from '../action-creator.sync.js'
import { getContent } from '../action-creator.async.js'

// INFO - CH - 2020-06-16 - this file is a component that render null because that way, it can uses the TracimComponent
// HOC like apps would do. It also allow to use connect() from redux which adds the props dispatch().
export class ReduxTlmDispatcher extends React.Component {
  constructor (props) {
    super(props)

    props.registerLiveMessageHandlerList([
      // Workspace
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified },

      // Role
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleMemberDeleted },

      // content created
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentCreated },

      // content modified
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentModified },

      // content deleted
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentDeleted },

      // content restored
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentUnDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentUnDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentUnDeleted },

      // User
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified }
    ])
  }

  handleWorkspaceModified = data => {
    this.props.dispatch(updateWorkspaceDetail(data.workspace))
  }

  handleMemberCreated = data => {
    this.props.dispatch(addWorkspaceMember(data.user, data.workspace.workspace_id, data.member))
  }

  handleMemberModified = data => {
    this.props.dispatch(updateWorkspaceMember(data.user, data.workspace.workspace_id, data.member))
  }

  handleMemberDeleted = data => {
    this.props.dispatch(removeWorkspaceMember(data.user.user_id, data.workspace.workspace_id))
  }

  handleContentCreated = data => {
    this.props.dispatch(addWorkspaceContentList([data.content], data.workspace.workspace_id))
  }

  handleContentCommentCreated = async data => {
    const commentParentId = data.content.parent_id
    const response = await this.props.dispatch(getContent(data.workspace.workspace_id, commentParentId))

    if (response.status !== 200) return

    this.props.dispatch(removeWorkspaceReadStatus(response.json, data.workspace.workspace_id))
  }

  handleContentModified = data => {
    this.props.dispatch(updateWorkspaceContentList([data.content], data.workspace.workspace_id))
  }

  handleContentDeleted = data => {
    this.props.dispatch(deleteWorkspaceContentList([data.content], data.workspace.workspace_id))
  }

  handleContentUnDeleted = data => {
    this.props.dispatch(unDeleteWorkspaceContentList([data.content], data.workspace.workspace_id))
  }

  handleUserModified = data => {
    this.props.dispatch(updateUser(data.user))
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ workspaceContentList }) => ({ workspaceContentList })
export default connect(mapStateToProps)(TracimComponent(ReduxTlmDispatcher))
