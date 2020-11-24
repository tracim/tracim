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
        onClickCopyLink={props.activity.onClickCopyLink} // eslint-disable-line react/jsx-handler-names
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
  activity: PropTypes.object.isRequired
}
