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

// INFO - CH - 2020-06-16 - this file is a component that render null because that way, it can use the TracimComponent
// HOC like apps would do. It also allow using connect() from redux which adds the props dispatch().
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

      // Mention
      { entityType: TLM_ET.MENTION, coreEntityType: TLM_CET.CREATED, handler: this.handleMentionCreated },

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
    const { props } = this
    props.dispatch(removeWorkspace(data.fields.workspace))
    if (props.user.userId !== data.fields.user.user_id) props.dispatch(addNotification(data))
  }

  handleWorkspaceModified = data => {
    const { props } = this
    props.dispatch(updateWorkspaceDetail(data.fields.workspace))
    if (props.user.userId !== data.fields.user.user_id) props.dispatch(addNotification(data))
  }

  handleMemberCreated = data => {
    const { props } = this
    props.dispatch(addWorkspaceMember(data.fields.user, data.fields.workspace.workspace_id, data.fields.member))
    if (props.user.userId !== data.fields.user.user_id) props.dispatch(addNotification(data))
  }

  handleMemberModified = data => {
    const { props } = this
    props.dispatch(updateWorkspaceMember(data.fields.user, data.fields.workspace.workspace_id, data.fields.member))
    if (props.user.userId !== data.fields.user.user_id) props.dispatch(addNotification(data))
  }

  handleMemberDeleted = data => {
    const { props } = this
    props.dispatch(removeWorkspaceMember(data.fields.user.user_id, data.fields.workspace.workspace_id))
    if (props.user.userId === data.fields.user.user_id) props.dispatch(removeWorkspace(data.fields.workspace))
    else props.dispatch(addNotification(data))
  }

  handleMentionCreated = data => {
    this.props.dispatch(addNotification(data))
  }

  handleContentCreated = data => {
    const { props } = this
    props.dispatch(addWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    if (props.user.userId !== data.fields.user.user_id) props.dispatch(addNotification(data))
  }

  handleContentCommentCreated = async data => {
    const { props } = this
    if (data.fields.author.user_id === props.user.userId) return
    const commentParentId = data.fields.content.parent_id
    const response = await props.dispatch(getContent(data.fields.workspace.workspace_id, commentParentId))

    if (response.status !== 200) return
    const notificationData = {
      ...data,
      fields: {
        ...data.fields,
        content: {
          ...data.fields.content,
          parent_label: response.json.label,
          parent_content_type: response.json.content_type
        }
      }
    }
    props.dispatch(addNotification(notificationData))
    props.dispatch(removeWorkspaceReadStatus(response.json, data.fields.workspace.workspace_id))
  }

  handleContentModified = data => {
    const { props } = this
    props.dispatch(updateWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    if (data.fields.author.user_id === props.user.userId) {
      props.dispatch(addWorkspaceReadStatus(data.fields.content, data.fields.workspace.workspace_id))
    } else props.dispatch(addNotification(data))
  }

  handleContentDeleted = data => {
    const { props } = this
    props.dispatch(deleteWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    if (props.user.userId !== data.fields.user.user_id) props.dispatch(addNotification(data))
  }

  handleContentUnDeleted = data => {
    const { props } = this
    props.dispatch(unDeleteWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    if (props.user.userId !== data.fields.user.user_id) props.dispatch(addNotification(data))
  }

  handleUserModified = data => {
    const { props } = this
    props.dispatch(updateUser(data.fields.user))
    if (props.user.userId !== data.fields.user.user_id) props.dispatch(addNotification(data))
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ workspaceContentList, user }) => ({ workspaceContentList, user })
export default connect(mapStateToProps)(TracimComponent(ReduxTlmDispatcher))
