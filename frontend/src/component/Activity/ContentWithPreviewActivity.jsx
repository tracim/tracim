import React from 'react'
import PropTypes from 'prop-types'

import ContentActivityHeader from './ContentActivityHeader.jsx'
import ContentActivityFooter from './ContentActivityFooter.jsx'
import Preview from './Preview.jsx'

export const ContentWithPreviewActivity = props => {
  return (
    <div>
      <ContentActivityHeader
        content={props.activity.content}
        workspace={props.activity.newestMessage.fields.workspace}
        eventList={props.activity.eventList}
        newestMessage={props.activity.newestMessage}
        onClickCopyLink={props.onClickCopyLink}
        onEventClicked={props.onEventClicked}
        breadcrumbsList={props.breadcrumbsList}
      />
      <Preview content={props.activity.content} />
      <ContentActivityFooter
        content={props.activity.content}
        commentList={props.activity.commentList}
        reactionList={props.activity.reactionList}
      />
    </div>
  )
}

export default ContentWithPreviewActivity

ContentWithPreviewActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  breadcrumbsList: PropTypes.array,
  onEventClicked: PropTypes.func
}

ContentWithPreviewActivity.defaultProps = {
  breadcrumbsList: []
}
