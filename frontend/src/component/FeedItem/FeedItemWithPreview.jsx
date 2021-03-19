import React from 'react'
import PropTypes from 'prop-types'

import FeedItemHeader from './FeedItemHeader.jsx'
import FeedItemFooter from './FeedItemFooter.jsx'
import Preview from './Preview.jsx'

export const FeedItemWithPreview = props => {
  return (
    <div>
      <FeedItemHeader
        breadcrumbsList={props.breadcrumbsList}
        content={props.content}
        eventList={props.eventList}
        lastModificationType={props.lastModificationType}
        lastModificationEntityType={props.lastModificationEntityType}
        lastModificationSubEntityType={props.lastModificationSubEntityType}
        lastModifier={props.lastModifier}
        modifiedDate={props.modifiedDate}
        onClickCopyLink={props.onClickCopyLink}
        onEventClicked={props.onEventClicked}
        workspaceId={props.workspaceId}
      />
      <Preview content={props.content} />
      <FeedItemFooter
        commentList={props.commentList}
        content={props.content}
      />
      {props.children}
    </div>
  )
}

export default FeedItemWithPreview

FeedItemWithPreview.propTypes = {
  content: PropTypes.object.isRequired,
  lastModificationType: PropTypes.string.isRequired,
  lastModifier: PropTypes.object.isRequired,
  modifiedDate: PropTypes.string.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  breadcrumbsList: PropTypes.array,
  commentList: PropTypes.array,
  eventList: PropTypes.array,
  lastModificationEntityType: PropTypes.string,
  lastModificationSubEntityType: PropTypes.string,
  onEventClicked: PropTypes.func
}

FeedItemWithPreview.defaultProps = {
  breadcrumbsList: [],
  commentList: [],
  eventList: [],
  lastModificationEntityType: '',
  lastModificationSubEntityType: ''
}
