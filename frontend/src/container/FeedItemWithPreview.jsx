import React from 'react'
import PropTypes from 'prop-types'
import FeedItemHeader from '../component/FeedItem/FeedItemHeader.jsx'
import FeedItemFooter from '../component/FeedItem/FeedItemFooter.jsx'
import Preview from '../component/FeedItem/Preview.jsx'
import { FETCH_CONFIG } from '../util/helper.js'
import { postNewComment, Timeline } from 'tracim_frontend_lib'
import {
  newFlashMessage
} from '../action-creator.sync.js'

export class FeedItemWithPreview extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      newComment: ''
    }
  }

  handleChangeNewComment = (e) => this.setState({ newComment: e.target.value })

  handleClickSend = async () => {
    const { props, state } = this

    const fetchPostNewComment = await postNewComment(
      FETCH_CONFIG.apiUrl,
      props.workspaceId,
      props.content.id,
      state.newComment
    )
    switch (fetchPostNewComment.status) {
      case 200:
        this.setState({ newComment: '' })
        break
      default:
        props.dispatch(newFlashMessage(`${props.t('Error while saving new comment')}`, 'warning'))
        break
    }

  }

  render () {
    const { props } = this
    return (
      <div className='feedItem'>
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
        <div className='feedItem__content'>
          <Preview content={props.content} />
          <FeedItemFooter
            commentList={props.commentList}
            content={props.content}
            reactionList={props.reactionList}
          />
        </div>
        {props.showTimeline && (
          <Timeline
            apiUrl={FETCH_CONFIG.apiUrl}
            customClass='feedItem__timeline'
            customColor={props.customColor}
            disableComment={false} // UPDATE newComment é falso ou isDeprecated
            id={props.content.id}
            loggedUser={props.user}
            newComment={this.state.newComment}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickSend}
            shouldScrollToBottom={false}
            showTitle={false}
            timelineData={props.commentList}
          // wysiwyg: PropTypes.bool,
          // onClickWysiwygBtn: PropTypes.func,
          // onInitWysiwyg: PropTypes.func,
          // invalidMentionList: PropTypes.array,
          // rightPartOpen: PropTypes.bool,
          // onClickCancelSave: PropTypes.func,
          // onClickSaveAnyway: PropTypes.func,
          // searchForMentionInQuery: PropTypes.func,
          // showInvalidMentionPopup: PropTypes.bool,
          // onClickTranslateComment: PropTypes.func,
          // onClickRestoreComment: PropTypes.func translation
          />
        )}
      </div>
    )
  }
}

export default FeedItemWithPreview

FeedItemWithPreview.propTypes = {
  content: PropTypes.object.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  breadcrumbsList: PropTypes.array,
  commentList: PropTypes.array,
  customColor: PropTypes.string,
  eventList: PropTypes.array,
  lastModificationEntityType: PropTypes.string,
  lastModificationSubEntityType: PropTypes.string,
  lastModificationType: PropTypes.string,
  lastModifier: PropTypes.object,
  modifiedDate: PropTypes.string,
  onEventClicked: PropTypes.func,
  reactionList: PropTypes.array,
  showTimeline: PropTypes.bool
}

FeedItemWithPreview.defaultProps = {
  breadcrumbsList: [],
  commentList: [],
  customColor: '',
  eventList: [],
  lastModificationEntityType: '',
  lastModificationSubEntityType: '',
  lastModificationType: '',
  lastModifier: {},
  modifiedDate: '',
  reactionList: [],
  showTimeline: false
}
