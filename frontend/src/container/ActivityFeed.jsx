import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TLM_ENTITY_TYPE as TLM_ET,
  CONTENT_TYPE,
  TracimComponent
} from 'tracim_frontend_lib'

import FileActivity from '../component/Activity/FileActivity.jsx'

require('../css/ActivityFeed.styl')

export class ActivityFeed extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activityList: [{
        id: 'content-42',
        entityType: TLM_ET.CONTENT,
        eventList: [
          { eventId: 1, eventType: 'content.modified.file', author: { userId: 2, publicName: 'Foo' }, created: '2020-08-24' }
        ],
        reactionList: [],
        commentList: [],
        fields: {
          content: { content_id: 23, workspace_id: 42, label: 'Foo', content_type: 'file' },
          workspace: { workspace_id: 42, label: 'Workspace' }
        }
      }]
    }
  }

  renderContentComponent (activity) {
    switch (activity.fields.content.content_type) {
      case CONTENT_TYPE.FILE:
        return <FileActivity activity={activity} key={activity.id} />
    }
  }

  renderActivityComponent (activity) {
    switch (activity.entityType) {
      case TLM_ET.CONTENT:
        return this.renderContentComponent(activity)
    }
  }

  render () {
    const { state } = this

    return (
      <div className='activity_feed__list'>
        <div className='activity_feed__item'>{state.activityList.map(this.renderActivityComponent.bind(this))}</div>
      </div>
    )
  }
}

const mapStateToProps = ({ lang, user, system }) => ({ lang, user, system })
export default connect(mapStateToProps)(translate()(TracimComponent(ActivityFeed)))
