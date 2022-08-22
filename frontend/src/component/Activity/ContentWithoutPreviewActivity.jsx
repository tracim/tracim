import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import FeedItemHeader from '../FeedItem/FeedItemHeader.jsx'

export const ContentWithoutPreviewActivity = props => {
  const contentType = props.appList.find(app => app.slug === `contents/${props.content.type}`) ||
        { label: props.t(`No App for content-type ${props.content.type}`), faIcon: 'fas fa-question', hexcolor: '#000000' }

  return (
    <div className='feedItem'>
      <FeedItemHeader
        breadcrumbsList={props.breadcrumbsList}
        content={props.content}
        eventList={props.activity.eventList}
        lastModificationType={props.lastModificationType}
        lastModificationEntityType={props.lastModificationEntityType}
        lastModificationSubEntityType={props.lastModificationSubEntityType}
        lastModifier={props.activity.newestMessage.fields.author}
        isPublication={false}
        modifiedDate={props.activity.newestMessage.created}
        onClickCopyLink={props.onClickCopyLink}
        onEventClicked={props.onEventClicked}
        workspaceId={props.activity.newestMessage.fields.workspace.workspace_id}
        contentType={contentType}
      />
    </div>
  )
}

const mapStateToProps = ({ appList }) => ({ appList })
export default connect(mapStateToProps)(ContentWithoutPreviewActivity)

ContentWithoutPreviewActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  content: PropTypes.object.isRequired,
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
