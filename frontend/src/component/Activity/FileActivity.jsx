import React from 'react'
import PropTypes from 'prop-types'

import ContentActivityHeader from './ContentActivityHeader.jsx'
import ContentActivityFooter from './ContentActivityFooter.jsx'

export const FileActivity = props => {
  return (
    <div>
      <ContentActivityHeader
        content={props.activity.fields.content}
        workspace={props.activity.fields.workspace}
        eventList={props.activity.eventList}
      />
      <ContentActivityFooter
        content={props.activity.fields.content}
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
