import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST,
  ACCESSIBLE_SPACE_TYPE_LIST
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
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
  addWorkspaceReadStatus,
  removeAccessibleWorkspace,
  addAccessibleWorkspace,
  updateAccessibleWorkspace,
  addWorkspaceSubscription,
  removeWorkspaceSubscription,
  updateWorkspaceSubscription
} from '../action-creator.sync.js'
import {
  getContent,
  getUser
} from '../action-creator.async.js'
import { cloneDeep } from 'lodash'

// INFO - CH - 2020-06-16 - this file is a component that render null because that way, it can use the TracimComponent
// HOC like apps would do. It also allow using connect() from redux which adds the props dispatch().
export class ReduxTlmDispatcher extends React.Component {
  constructor (props) {
    super(props)

    props.registerLiveMessageHandlerList([
      // User
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.CREATED, handler: this.handleUserChanged },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.DELETED, handler: this.handleUserChanged },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.UNDELETED, handler: this.handleUserChanged },

      // Workspace
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.DELETED, handler: this.handleWorkspaceDeleted },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.CREATED, handler: this.handleWorkspaceCreated },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.UNDELETED, handler: this.handleWorkspaceChanged },

      // Role
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleMemberDeleted },

      // Mention
      { entityType: TLM_ET.MENTION, coreEntityType: TLM_CET.CREATED, handler: this.handleMentionCreated },

      // Workspace subscription
      { entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION, coreEntityType: TLM_CET.CREATED, handler: this.handleWorkspaceSubscriptionCreated },
      { entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION, coreEntityType: TLM_CET.DELETED, handler: this.handleWorkspaceSubscriptionDeleted },
      { entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceSubscriptionModified },

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
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentUnDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentUnDeleted }
    ])
  }

  handleNotification = data => {
    if (
      this.props.user.userId !== data.fields.author.user_id &&
      !GLOBAL_excludedNotifications.some(type => data.event_type.startsWith(type))
    ) {
      this.props.dispatch(addNotification(data))
    }
  }

  handleWorkspaceCreated = data => {
    const { props } = this
    if (ACCESSIBLE_SPACE_TYPE_LIST.some(s => s.slug === data.fields.workspace.access_type)) {
      props.dispatch(addAccessibleWorkspace(data.fields.workspace))
    }
    this.handleNotification(data)
  }

  handleWorkspaceDeleted = data => {
    const { props } = this
    props.dispatch(removeWorkspace(data.fields.workspace))
    props.dispatch(removeAccessibleWorkspace(data.fields.workspace))
    this.handleNotification(data)
  }

  handleWorkspaceModified = data => {
    const { props } = this
    props.dispatch(updateWorkspaceDetail(data.fields.workspace))
    if (ACCESSIBLE_SPACE_TYPE_LIST.some(s => s.slug === data.fields.workspace.access_type)) {
      props.dispatch(updateAccessibleWorkspace(data.fields.workspace))
    }
    this.handleNotification(data)
  }

  handleWorkspaceChanged = this.handleNotification

  handleMemberCreated = data => {
    const { props } = this
    props.dispatch(addWorkspaceMember(data.fields.user, data.fields.workspace.workspace_id, data.fields.member))
    if (props.user.userId === data.fields.user.user_id) {
      props.dispatch(removeAccessibleWorkspace(data.fields.workspace))
    }
    this.handleNotification(data)
  }

  handleMemberModified = data => {
    const { props } = this
    props.dispatch(updateWorkspaceMember(data.fields.user, data.fields.workspace.workspace_id, data.fields.member))
    this.handleNotification(data)
  }

  handleMemberDeleted = data => {
    const { props } = this
    props.dispatch(removeWorkspaceMember(data.fields.user.user_id, data.fields.workspace.workspace_id))
    if (props.user.userId === data.fields.user.user_id) {
      props.dispatch(removeWorkspace(data.fields.workspace))
      if (ACCESSIBLE_SPACE_TYPE_LIST.some(s => s.slug === data.fields.workspace.access_type)) {
        props.dispatch(addAccessibleWorkspace(data.fields.workspace))
      }
    }
    this.handleNotification(data)
  }

  handleMentionCreated = data => {
    this.handleNotification(data)
  }

  handleContentCreated = data => {
    const { props } = this
    props.dispatch(addWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    this.handleNotification(data)
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
          parent_content_type: response.json.content_type,
          parent_content_namespace: response.json.content_namespace
        }
      }
    }
    this.handleNotification(notificationData)
    props.dispatch(removeWorkspaceReadStatus(response.json, data.fields.workspace.workspace_id))
  }

  handleContentModified = data => {
    const { props } = this
    props.dispatch(updateWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    if (data.fields.author.user_id === props.user.userId) {
      props.dispatch(addWorkspaceReadStatus(data.fields.content, data.fields.workspace.workspace_id))
    }
    this.handleNotification(data)
  }

  handleContentDeleted = data => {
    const { props } = this
    props.dispatch(deleteWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    this.handleNotification(data)
  }

  handleContentUnDeleted = data => {
    const { props } = this
    props.dispatch(unDeleteWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    this.handleNotification(data)
  }

  fetchUserDetail = async () => {
    const { props } = this
    const fetchGetUser = await props.dispatch(getUser(props.user.userId))
    if (fetchGetUser.ok) return fetchGetUser.json
    props.dispatch(newFlashMessage(props.t('Error while loading user')))
    return null
  }

  handleUserModified = async (data) => {
    const { props } = this

    let newData

    if (data.fields.user.user_id === props.user.userId) {
      const updatedUser = await this.fetchUserDetail(props.user.userId)
      if (updatedUser) {
        newData = cloneDeep(data)
        newData.fields.user = updatedUser
      }
    } else {
      newData = data
    }

    props.dispatch(updateUser(newData.fields.user))
    this.handleNotification(newData)
  }

  handleUserChanged = data => {
    this.props.dispatch(addNotification(data))
  }

  handleWorkspaceSubscriptionCreated = data => {
    const { props } = this
    if (data.fields.user.user_id === props.user.userId) {
      props.dispatch(addWorkspaceSubscription(data.fields.subscription))
    }
    this.handleNotification(data)
  }

  handleWorkspaceSubscriptionDeleted = data => {
    const { props } = this
    if (data.fields.user.user_id === props.user.userId) {
      props.dispatch(removeWorkspaceSubscription(data.fields.subscription))
    }
    this.handleNotification(data)
  }

  handleWorkspaceSubscriptionModified = data => {
    const { props } = this
    if (data.fields.user.user_id === props.user.userId) {
      props.dispatch(updateWorkspaceSubscription(data.fields.subscription))
    }
    this.handleNotification(data)
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ workspaceContentList, user }) => ({ workspaceContentList, user })
export default translate()(connect(mapStateToProps)(TracimComponent(ReduxTlmDispatcher)))
