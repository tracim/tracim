import React from 'react'

import { NUMBER_RESULTS_BY_PAGE } from 'tracim_frontend_lib'

import {
  mergeWithActivityList,
  addMessageToActivityList,
  sortActivityList
} from '../util/activity.js'
import { FETCH_CONFIG, PAGE } from '../util/helper.js'
import { getNotificationList } from '../action-creator.async.js'
import { newFlashMessage } from '../action-creator.sync.js'

const ACTIVITY_COUNT_PER_PAGE = NUMBER_RESULTS_BY_PAGE
const NOTIFICATION_COUNT_PER_REQUEST = ACTIVITY_COUNT_PER_PAGE

/**
 * Higher-Order Component which factorizes the common behavior between workspace and personal
 * activity feeds.
 * @param {React.Component} WrappedComponent component you want to wrap with this HOC
 * @param {function} setActivityList a redux action that will set the activity.list prop when dispatched.
 * @param {function} setActivityNextPage a redux action that will set the
 *  activity.hasNextPage/nextPageToken props when dispatched.
 * @param {function} resetActivity a redux action that resets the activity prop when dispatched.
 */
const withActivity = (WrappedComponent, setActivityList, setActivityNextPage, resetActivity) => {
  return class extends React.Component {
    constructor (props) {
      super(props)
      this.state = {
        showRefresh: false
      }
      this.changingActivityList = false
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
      // INFO - GB - 2020-11-20 - Algorithm based on
      // https://stackoverflow.com/questions/55190650/copy-link-on-button-click-into-clipboard-not-working
      const tmp = document.createElement('textarea')
      document.body.appendChild(tmp)
      tmp.value = `${window.location.origin}${PAGE.WORKSPACE.CONTENT(
        props.workspaceId,
        content.content_type,
        content.content_id
      )}`
      tmp.select()
      document.execCommand('copy')
      document.body.removeChild(tmp)
      props.dispatch(newFlashMessage(props.t('The link has been copied to clipboard'), 'info'))
    }

    updateActivityListFromTlm = async (data) => {
      const { props } = this

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
     * Load at minimum the given count of activities by getting messages through
     * /api/users/<user_id>/messages
     * @param {Number} minActivityCount minimum activity count to load
     * @param {boolean} resetList if true the current activity list will be cleared before load
     * @param {Number} workspaceId filter the messages by workspace id (useful for the workspace activity feed)
     */
    loadActivities = async (minActivityCount, resetList = false, workspaceId = null) => {
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
            activityFeedEvents: true,
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
      props.dispatch(setActivityList(activityList))
      props.dispatch(setActivityNextPage(hasNextPage, nextPageToken))
      this.changingActivityList = false
    }

    render () {
      return (
        <WrappedComponent
          loadActivities={this.loadActivities}
          handleTlm={this.updateActivityListFromTlm}
          onRefreshClicked={this.handleRefreshClicked}
          onCopyLinkClicked={this.handleClickCopyLink}
          showRefresh={this.state.showRefresh}
          {...this.props}
        />)
    }
  }
}

export { withActivity, ACTIVITY_COUNT_PER_PAGE }
