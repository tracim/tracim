import React from 'react'
import PropTypes from 'prop-types'

import ContentActivityHeader from './ContentActivityHeader.jsx'

export const ContentWithoutPreviewActivity = props => {
  return (
    <ContentActivityHeader
      content={props.activity.newestMessage.fields.content}
      workspace={props.activity.newestMessage.fields.workspace}
      eventList={props.activity.eventList}
      newestMessage={props.activity.newestMessage}
      onClickCopyLink={props.activity.onClickCopyLink} // eslint-disable-line react/jsx-handler-names
    />
  )
}

export default ContentWithoutPreviewActivity

ContentWithoutPreviewActivity.propTypes = {
  activity: PropTypes.object.isRequired
}
