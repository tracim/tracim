import React from 'react'
import PropTypes from 'prop-types'

import FeedItemHeader from '../FeedItem/FeedItemHeader.jsx'

export const ContentWithoutPreviewActivity = props => {
  return (
    <div className='feedItem'>
      <FeedItemHeader
        breadcrumbsList={props.breadcrumbsList}
        content={props.activity.newestMessage.fields.content}
        eventList={props.activity.eventList}
        lastModificationType={props.lastModificationType}
        lastModificationEntityType={props.lastModificationEntityType}
        lastModificationSubEntityType={props.lastModificationSubEntityType}
        lastModifier={props.activity.newestMessage.fields.author}
        modifiedDate={props.activity.newestMessage.created}
        onClickCopyLink={props.onClickCopyLink}
        onEventClicked={props.onEventClicked}
        workspaceId={props.activity.newestMessage.fields.workspace.workspace_id}
      />
    </div>
  )
}

export default ContentWithoutPreviewActivity

ContentWithoutPreviewActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  lastModificationType: PropTypes.string.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  breadcrumbsList: PropTypes.array,
  lastModificationEntityType: PropTypes.string,
  lastModificationSubEntityType: PropTypes.string,
  onEventClicked: PropTypes.func
}

ContentWithoutPreviewActivity.defaultProps = {
  breadcrumbsList: [],
  lastModificationEntityType: '',
  lastModificationSubEntityType: ''
}
