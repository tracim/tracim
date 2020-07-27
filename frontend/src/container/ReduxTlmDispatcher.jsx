import React from 'react'
import { connect } from 'react-redux'
import {
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST
} from 'tracim_frontend_lib'
import {
  addNotification,
  addWorkspaceContentList,
  addWorkspaceMember,
  deleteWorkspaceContentList,
  removeWorkspaceMember,
  removeWorkspaceReadStatus,
  unDeleteWorkspaceContentList,
  updateUser,
  updateWorkspaceContentList,
  updateWorkspaceDetail,
  updateWorkspaceMember,
  removeWorkspace,
  addWorkspaceReadStatus
} from '../action-creator.sync.js'
import { getContent } from '../action-creator.async.js'

// INFO - CH - 2020-06-16 - this file is a component that render null because that way, it can uses the TracimComponent
// HOC like apps would do. It also allow to use connect() from redux which adds the props dispatch().
export class ReduxTlmDispatcher extends React.Component {
  constructor (props) {
    super(props)

    props.registerLiveMessageHandlerList([
      // User
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified },

      // Workspace
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.DELETED, handler: this.handleWorkspaceDeleted },

      // Role
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleMemberDeleted },

      // Content created
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentCreated },

      // Content modified
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentModified },

      // Content deleted
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentDeleted },

      // Content restored
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentUnDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentUnDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentUnDeleted }
    ])
  }

  handleWorkspaceDeleted = data => {
    this.props.dispatch(removeWorkspace(data.fields.workspace))
  }

  handleWorkspaceModified = data => {
    this.props.dispatch(updateWorkspaceDetail(data.fields.workspace))
  }

  handleMemberCreated = data => {
    this.props.dispatch(addWorkspaceMember(data.fields.user, data.fields.workspace.workspace_id, data.fields.member))
    this.props.dispatch(addNotification(data))
  }

  handleMemberModified = data => {
    this.props.dispatch(updateWorkspaceMember(data.fields.user, data.fields.workspace.workspace_id, data.fields.member))
  }

  handleMemberDeleted = data => {
    this.props.dispatch(removeWorkspaceMember(data.fields.user.user_id, data.fields.workspace.workspace_id))
    if (this.props.user.userId === data.fields.user.user_id) this.props.dispatch(removeWorkspace(data.fields.workspace))
  }

  handleContentCreated = data => {
    this.props.dispatch(addWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    this.props.dispatch(addNotification(data))
  }

  handleContentCommentCreated = async data => {
    if (data.fields.author.user_id === this.props.user.userId) return
    const commentParentId = data.fields.content.parent_id
    const response = await this.props.dispatch(getContent(data.fields.workspace.workspace_id, commentParentId))

    if (response.status !== 200) return

    this.props.dispatch(removeWorkspaceReadStatus(response.json, data.fields.workspace.workspace_id))
  }

  handleContentModified = data => {
    this.props.dispatch(updateWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    if (data.fields.author.user_id === this.props.user.userId) {
      this.props.dispatch(addWorkspaceReadStatus(data.fields.content, data.fields.workspace.workspace_id))
    }
    this.props.dispatch(addNotification(data))
  }

  handleContentDeleted = data => {
    this.props.dispatch(deleteWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
  }

  handleContentUnDeleted = data => {
    this.props.dispatch(unDeleteWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
  }

  handleUserModified = data => {
    this.props.dispatch(updateUser(data.fields.user))
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ workspaceContentList, user }) => ({ workspaceContentList, user })
export default connect(mapStateToProps)(TracimComponent(ReduxTlmDispatcher))
