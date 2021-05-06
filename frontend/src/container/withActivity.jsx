import React from 'react'

import {
  CONTENT_TYPE,
  NUMBER_RESULTS_BY_PAGE,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_SUB
} from 'tracim_frontend_lib'

import {
  mergeWithActivityList,
  addMessageToActivityList,
  sortActivityList
} from '../util/activity.js'
import {
  FETCH_CONFIG,
  handleClickCopyLink
} from '../util/helper.js'
import { getNotificationList } from '../action-creator.async.js'
import { newFlashMessage } from '../action-creator.sync.js'

const ACTIVITY_COUNT_PER_PAGE = NUMBER_RESULTS_BY_PAGE
const ACTIVITY_HISTORY_COUNT = 5
const NOTIFICATION_COUNT_PER_REQUEST = ACTIVITY_COUNT_PER_PAGE*3

const makeCancelable = (promise) => {
  let isCanceled = false
  const wrappedPromise =
    new Promise((resolve, reject) => {
      promise
        .then((val) => (isCanceled ? reject(new Error('Cancelled')) : resolve(val)))
        .catch((error) => (reject(isCanceled ? new Error('Cancelled') : error)))
    })
  return {
    promise: wrappedPromise,
    cancel: () => { isCanceled = true }
  }
}

/**
 * Higher-Order Component which factorizes the common behavior between workspace and personal
 * recent activities.
 * @param {React.Component} WrappedComponent component you want to wrap with this HOC
 * @param {function} setActivityList a redux action that will set the activity.list prop when dispatched.
 * @param {function} setActivityNextPage a redux action that will set the
 *  activity.hasNextPage/nextPageToken props when dispatched.
 * @param {function} resetActivity a redux action that resets the activity prop when dispatched.
 * @param {function} setActivityEventList a redux action that sets the event list of a given activity
 */
const withActivity = (WrappedComponent, setActivityList, setActivityNextPage, resetActivity, setActivityEventList) => {
  return class extends React.Component {
    constructor (props) {
      super(props)
      this.state = {
        showRefresh: false
      }
      this.changingActivityList = false
      this.loadActivitiesPromise = null
    }

    /**
     * Return a promise that, when awaited, will ensure that
     * no other update is taking place on props.activity.list.
     * Used in conjunction with this.changingActivityList.
     */
    waitForNoChange = () => {
      return new Promise((resolve, reject) => {
        const waitNotIsChanging = () => {
          if (!this.changingActivityList) return resolve()
          setTimeout(waitNotIsChanging, 5)
        }
        waitNotIsChanging()
      })
    }

    handleClickCopyLink = content => {
      const { props } = this
      handleClickCopyLink(content.content_type === CONTENT_TYPE.COMMENT
        ? {
          id: content.parent_id,
          workspaceId: props.workspaceId,
          type: content.parent_content_type
        }
        : {
          id: content.content_id,
          workspaceId: content.workspace_id,
          type: content.content_type
        }
      )
      props.dispatch(newFlashMessage(props.t('The link has been copied to clipboard'), 'info'))
    }

    handleEventClick = async (activity) => {
      const { props } = this
      const messageListResponse = await props.dispatch(getNotificationList(
        props.user.userId,
        {
          notificationsPerPage: ACTIVITY_HISTORY_COUNT,
          recentActivitiesEvents: true,
          relatedContentId: activity.content.content_id,
          workspaceId: activity.content.workspace_id,
          includeNotSent: true
        }
      ))
      props.dispatch(setActivityEventList(activity.id, messageListResponse.json.items))
    }

    updateActivityListFromTlm = async (data) => {
      const { props } = this
      if (
        data.event_type === `${TLM_ET.CONTENT}.${TLM_CET.MODIFIED}.${TLM_SUB.COMMENT}` ||
        data.event_type === `${TLM_ET.CONTENT}.${TLM_CET.DELETED}.${TLM_SUB.COMMENT}`
      ) return
      await this.waitForNoChange()
      this.changingActivityList = true
      const updatedActivityList = await addMessageToActivityList(data, props.activity.list, FETCH_CONFIG.apiUrl)
      props.dispatch(setActivityList(updatedActivityList))
      const showRefresh = (
        updatedActivityList.length > 0 &&
        updatedActivityList[0].newestMessage.event_id !== data.event_id
      )
      this.setState({ showRefresh })
      this.changingActivityList = false
    }

    /**
     * Sort already present activities so that the newest ones are first.
     */
    handleRefreshClicked = () => {
      const { props } = this
      const updatedActivityList = sortActivityList(props.activity.list)
      this.setState({ showRefresh: false })
      props.dispatch(setActivityList(updatedActivityList))
    }

    /**
       Wrap loadActivitiesImpl() so that the dispatch in redux can be cancelled.
     */
    loadActivities = async (minActivityCount, resetList = false, workspaceId = null) => {
      const { props } = this

      this.loadActivitiesPromise = makeCancelable(
        this.loadActivitiesImpl(
          minActivityCount,
          resetList,
          workspaceId
        )
      )
      try {
        const activitiesParams = await this.loadActivitiesPromise.promise
        props.dispatch(setActivityList(activitiesParams.list))
        props.dispatch(setActivityNextPage(activitiesParams.hasNextPage, activitiesParams.nextPageToken))
      } catch {}
      this.loadActivitiesPromise = null
    }

    /**
     * Load at minimum the given count of activities by getting messages through
     * /api/users/<user_id>/messages
     * @param {Number} minActivityCount minimum activity count to load
     * @param {boolean} resetList if true the current activity list will be cleared before load
     * @param {Number} workspaceId filter the messages by workspace id (useful for the workspace recent activities)
     */
    loadActivitiesImpl = async (minActivityCount, resetList = false, workspaceId = null) => {
      const { props } = this
      let activityList = props.activity.list
      let hasNextPage = props.activity.hasNextPage
      let nextPageToken = props.activity.nextPageToken
      if (resetList) {
        props.dispatch(resetActivity())
        activityList = []
        hasNextPage = true
        nextPageToken = ''
      }
      await this.waitForNoChange()
      this.changingActivityList = true
      while (hasNextPage && activityList.length < minActivityCount) {
        const messageListResponse = await props.dispatch(getNotificationList(
          props.user.userId,
          {
            nextPageToken: nextPageToken,
            notificationsPerPage: NOTIFICATION_COUNT_PER_REQUEST,
            recentActivitiesEvents: true,
            workspaceId: workspaceId,
            includeNotSent: true
          }
        ))
        activityList = await mergeWithActivityList(
          messageListResponse.json.items,
          activityList,
          FETCH_CONFIG.apiUrl
        )
        hasNextPage = messageListResponse.json.has_next
        nextPageToken = messageListResponse.json.next_page_token
      }
      this.changingActivityList = false
      return {
        list: activityList,
        hasNextPage,
        nextPageToken
      }
    }

    cancelCurrentLoadActivities = () => {
      if (!this.loadActivitiesPromise) return
      this.loadActivitiesPromise.cancel()
    }

    render () {
      return (
        <WrappedComponent
          loadActivities={this.loadActivities}
          handleTlm={this.updateActivityListFromTlm}
          onRefreshClicked={this.handleRefreshClicked}
          onCopyLinkClicked={this.handleClickCopyLink}
          onEventClicked={this.handleEventClick}
          showRefresh={this.state.showRefresh}
          cancelCurrentLoadActivities={this.cancelCurrentLoadActivities}
          {...this.props}
        />
      )
    }
  }
}

export { withActivity, ACTIVITY_COUNT_PER_PAGE }
