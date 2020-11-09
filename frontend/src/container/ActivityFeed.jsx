import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TLM_ENTITY_TYPE as TLM_ET,
  CONTENT_TYPE,
  TracimComponent
} from 'tracim_frontend_lib'

<<<<<<< HEAD
import FileActivity from '../component/Activity/FileActivity.jsx'
=======
import {
  createActivityList,
  mergeWithActivityList
} from '../util/activity.js'
import {
  FETCH_CONFIG
} from '../util/helper.js'
import {
  getNotificationList
} from '../action-creator.async'

import FileActivity from '../component/Activity/FileActivity.jsx'
import FolderActivity from '../component/Activity/FolderActivity.jsx'
import MemberActivity from '../component/Activity/MemberActivity.jsx'
import { setWorkspaceActivityList } from '../action-creator.sync.js'
>>>>>>> 5a27e0500 (FUCK)

require('../css/ActivityFeed.styl')

export class ActivityFeed extends React.Component {
  componentDidMount () {
    this.loadActivityList()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.currentWorkspace.id === this.props.currentWorkspace.id) return

    this.loadActivityList()
  }

  async loadActivityList () {
    const { props } = this
    let messageListResponse = await props.dispatch(getNotificationList(
      props.user.userId,
      {
        notificationsPerPage: 25,
        workspaceId: props.currentWorkspace.id
      }
    ))
    let activityList = await createActivityList(messageListResponse.json.items, FETCH_CONFIG.apiUrl)
    while (activityList.length < 0 && messageListResponse.json.has_next) {
      messageListResponse = await props.dispatch(getNotificationList(
        props.user.userId,
        {
          nextPageToken: messageListResponse.json.next_page_token,
          notificationsPerPage: 25,
          workspaceId: props.currentWorkspace.id
        }
      ))
      activityList = await mergeWithActivityList(messageListResponse.json.items, activityList, FETCH_CONFIG.apiUrl)
    }
    props.dispatch(setWorkspaceActivityList(activityList))
  }

  renderActivityComponent (activity) {
    let component = <span>Unknown activity type!</span>
    switch (activity.entityType) {
      case TLM_ET.CONTENT:
        component = activity.newestMessage.fields.content.content_type === CONTENT_TYPE.FOLDER
          ? <FolderActivity activity={activity} key={activity.id} />
          : <FileActivity activity={activity} key={activity.id} />
        break
      case TLM_ET.SHAREDSPACE_MEMBER:
        //component = <MemberActivity activity={activity} key={activity.id} />
        break
    }
    return <div className='activity_feed__item'>{component}</div>
  }

  render () {
    const { props } = this

    return (
      <div className='activity_feed tracim__content fullWidthFullHeight'>
        <div className='activity_feed__list'>
          {props.workspaceActivityList.map(this.renderActivityComponent.bind(this))}
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ lang, user, workspaceActivityList, currentWorkspace }) => ({ lang, user, workspaceActivityList, currentWorkspace })
export default connect(mapStateToProps)(translate()(TracimComponent(ActivityFeed)))
