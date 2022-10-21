import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  getComment,
  getContent,
  handleFetchResult,
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST,
  USER_CALL_STATE as USC,
  ACCESSIBLE_SPACE_TYPE_LIST
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  addNotification,
  addWorkspaceContentList,
  addWorkspaceList,
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
import { getUser } from '../action-creator.async.js'
import { FETCH_CONFIG } from '../util/helper.js'
import { cloneDeep } from 'lodash'

// INFO - RJ - 2021-09-08 - we remove the star from the excluded types since we
// use startsWith on notification types to check whether the type is excluded
const EXCLUDED_NOTIFICATION_TYPE_PREFIXES = GLOBAL_excludedNotifications.map(type => type.replace(/\*$/, ''))

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
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.TODO, handler: this.handleToDo },

      // Content modified
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.TODO, handler: this.handleToDo },

      // Content deleted
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.TODO, handler: this.handleToDo },

      // Content restored
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentUnDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentUnDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentUnDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FOLDER, handler: this.handleContentUnDeleted },

      // User call
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserCallNotification }
    ])
  }

  handleNotification = data => {
    const { props } = this
    if (
      props.user.userId !== data.fields.author.user_id &&
      !EXCLUDED_NOTIFICATION_TYPE_PREFIXES.some(type => data.event_type.startsWith(type))
    ) {
      props.dispatch(addNotification(data, props.workspaceList))
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

  /**
   * Handle function for todos
   * If the todo has an assigned user that is not the current user, we do nothing
   * @param {*} data TLM
   * @returns {void}
   */
  handleToDo = data => {
    // INFO - MP - 2022-10-21 - If the username is undefined then the todo notification will be
    // displayed to everyone.
    if (
      data.fields.content.assignee.username &&
      data.fields.content.assignee.user_id !== this.props.user.userId
    ) return

    this.handleNotification(data)
  }

  handleMemberCreated = data => {
    const { props } = this
    if (props.user.userId === data.fields.user.user_id || props.workspaceList.find(space => space.id === data.fields.workspace.workspace_id)) {
      // NOTE - RJ & MP - 2022-02-18
      // When receiving a member created TLM, it is possible that we haven't added the workspace itself yet
      // In this case, addWorkspaceMember does nothing.
      // We actually noticed that the member created TLM arrives before the workspace created TLM.
      // Let's add the workpace first to avoid this.
      // See https://github.com/tracim/tracim/issues/5451
      props.dispatch(addWorkspaceList([data.fields.workspace]))

      props.dispatch(addWorkspaceMember(data.fields.user, data.fields.workspace.workspace_id, data.fields.member))
      if (props.user.userId === data.fields.user.user_id) {
        props.dispatch(removeAccessibleWorkspace(data.fields.workspace))
      }
      this.handleNotification(data)
    }
  }

  handleMemberModified = data => {
    const { props } = this
    props.dispatch(addWorkspaceList([data.fields.workspace]))
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

  handleMentionCreated = async data => {
    const { props } = this
    let content
    if (data.fields.content.content_type === TLM_ST.COMMENT) {
      const fetchGetComment = await handleFetchResult(
        await getComment(FETCH_CONFIG.apiUrl, data.fields.workspace.workspace_id, data.fields.content.parent_id, data.fields.content.content_id)
      )
      switch (fetchGetComment.apiResponse.status) {
        case 200:
          content = fetchGetComment.body
          break
        default:
          props.dispatch(newFlashMessage(props.t('Unknown comment')))
          return
      }
    } else content = await this.getContent(data.fields.content.content_id)

    this.handleNotification({
      ...data,
      fields: {
        ...data.fields,
        content: content
      }
    })
  }

  getContent = async (contentId) => {
    const { props } = this
    const fetchGetContent = await handleFetchResult(await getContent(FETCH_CONFIG.apiUrl, contentId))
    switch (fetchGetContent.apiResponse.status) {
      case 200: return fetchGetContent.body
      default:
        props.dispatch(newFlashMessage(props.t('Unknown content')))
        return {}
    }
  }

  handleContentCreated = async data => {
    const { props } = this
    const content = await this.getContent(data.fields.content.content_id)
    props.dispatch(addWorkspaceContentList([content], data.fields.workspace.workspace_id))
    this.handleNotification({
      ...data,
      fields: {
        ...data.fields,
        content: content
      }
    })
  }

  handleContentCommentCreated = async data => {
    const { props } = this
    if (data.fields.author.user_id === props.user.userId) return

    const fetchGetComment = await handleFetchResult(
      await getComment(FETCH_CONFIG.apiUrl, data.fields.workspace.workspace_id, data.fields.content.parent_id, data.fields.content.content_id)
    )

    switch (fetchGetComment.apiResponse.status) {
      case 200: {
        const notificationData = {
          ...data,
          fields: {
            ...data.fields,
            content: fetchGetComment.body
          }
        }
        this.handleNotification(notificationData)
        props.dispatch(removeWorkspaceReadStatus(data.fields.workspace, data.fields.workspace.workspace_id))
        break
      }
      default:
        props.dispatch(newFlashMessage(props.t('Unknown content')))
        break
    }
  }

  handleContentModified = async data => {
    const { props } = this
    const content = await this.getContent(data.fields.content.content_id)
    props.dispatch(updateWorkspaceContentList([content], data.fields.workspace.workspace_id))
    if (data.fields.author.user_id === props.user.userId) {
      props.dispatch(addWorkspaceReadStatus(content, data.fields.workspace.workspace_id))
    }
    this.handleNotification({
      ...data,
      fields: {
        ...data.fields,
        content: content
      }
    })
  }

  handleContentDeleted = data => {
    const { props } = this
    props.dispatch(deleteWorkspaceContentList([data.fields.content], data.fields.workspace.workspace_id))
    this.handleNotification(data)
  }

  handleContentUnDeleted = async data => {
    const { props } = this
    const content = await this.getContent(data.fields.content.content_id)
    props.dispatch(unDeleteWorkspaceContentList([content], data.fields.workspace.workspace_id))
    this.handleNotification({
      ...data,
      fields: {
        ...data.fields,
        content: content
      }
    })
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
    const { props } = this

    this.props.dispatch(addNotification(data, props.workspaceList))
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

  handleUserCallNotification = data => {
    const { props } = this
    if (data.fields.author.user_id !== props.user.userId) {
      if (data.fields.user_call.state === USC.CANCELLED ||
        data.fields.user_call.state === USC.UNANSWERED) {
        this.handleNotification(data)
      }
    }
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ workspaceList, workspaceContentList, user }) => ({ workspaceList, workspaceContentList, user })
export default translate()(connect(mapStateToProps)(TracimComponent(ReduxTlmDispatcher)))
