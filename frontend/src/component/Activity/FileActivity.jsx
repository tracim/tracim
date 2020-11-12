import React from 'react'
import PropTypes from 'prop-types'

import ContentActivityHeader from './ContentActivityHeader.jsx'
import ContentActivityFooter from './ContentActivityFooter.jsx'

export const ContentWithPreviewActivity = props => {
  return (
    <div>
      <ContentActivityHeader
        content={props.activity.content}
        workspace={props.activity.newestMessage.fields.workspace}
        eventList={props.activity.eventList}
        newestMessage={props.activity.newestMessage}
      />
      <ContentActivityFooter
        content={props.activity.content}
        commentList={props.activity.commentList}
        reactionList={props.activity.reactionList}
      />
    </div>
  )
}

export default FileActivity

FileActivity.propTypes = {
  activity: PropTypes.object.isRequired
}
