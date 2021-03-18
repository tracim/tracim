import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import FeedItemHeader from '../component/FeedItem/FeedItemHeader.jsx'
import FeedItemFooter from '../component/FeedItem/FeedItemFooter.jsx'
import Preview from '../component/FeedItem/Preview.jsx'
import { FETCH_CONFIG } from '../util/helper.js'
import { newFlashMessage } from '../action-creator.sync.js'
import {
  // CUSTOM_EVENT,
  postNewComment,
  Timeline,
  TracimComponent
} from 'tracim_frontend_lib'

export class FeedItemWithPreview extends React.Component {
  constructor (props) {
    super(props)
    // props.registerCustomEventHandlerList([
    //   { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    // ]) why

    this.state = {
      newComment: '',
      timelineWysiwyg: false
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { props, state } = this
    if (prevState.timelineWysiwyg && !state.timelineWysiwyg) globalThis.tinymce.remove(`#wysiwygTimelineComment${props.content.id}`)
  }

  componentWillUnmount () {
    globalThis.tinymce.remove(`#wysiwygTimelineComment${this.props.content.id}`)
  }

  handleAllAppChangeLanguage = (data) => {
    const { props, state } = this
    if (state.timelineWysiwyg) {
      globalThis.tinymce.remove(`#wysiwygTimelineComment${props.content.id}`)
      globalThis.wysiwyg(`wysiwygTimelineComment${props.content.id}`, data, this.handleChangeNewComment)
    }
  }

  handleInitWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      `#wysiwygTimelineComment${this.props.content.id}`,
      this.props.user.lang,
      this.handleChangeNewComment,
      handleTinyMceInput,
      handleTinyMceKeyDown,
      handleTinyMceKeyUp,
      handleTinyMceSelectionChange
    )
  }

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

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
      case 400:
        props.dispatch(newFlashMessage(fetchPostNewComment.body.code === 2044
          ? `${props.t('You must change the status or restore this content to comment')}`
          : `${props.t('Error while saving new comment')}`
        , 'warning'))
        break
      default:
        props.dispatch(newFlashMessage(`${props.t('Error while saving new comment')}`, 'warning'))
        break
    }
  }

  render () {
    const { props, state } = this

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
            id={props.content.id}
            loggedUser={props.user}
            newComment={state.newComment}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickSend}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            onInitWysiwyg={this.handleInitWysiwyg}
            shouldScrollToBottom={false}
            showTitle={false}
            timelineData={props.commentList}
            wysiwyg={state.timelineWysiwyg}
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
export default translate()(TracimComponent(FeedItemWithPreview))

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
