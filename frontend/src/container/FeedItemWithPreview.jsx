import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import FeedItemHeader from '../component/FeedItem/FeedItemHeader.jsx'
import FeedItemFooter from '../component/FeedItem/FeedItemFooter.jsx'
import Preview from '../component/FeedItem/Preview.jsx'
import { FETCH_CONFIG } from '../util/helper.js'
import {
  appContentFactory,
  CUSTOM_EVENT,
  handleInvalidMentionInComment,
  Timeline,
  TracimComponent
} from 'tracim_frontend_lib'

export class FeedItemWithPreview extends React.Component {
  constructor (props) {
    super(props)
    props.setApiUrl(FETCH_CONFIG.apiUrl)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    this.state = {
      invalidMentionList: [],
      newComment: '',
      showInvalidMentionPopupInComment: false,
      timelineWysiwyg: false
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { props, state } = this
    if (props.showTimeline && prevState.timelineWysiwyg && !state.timelineWysiwyg) {
      globalThis.tinymce.remove(this.getWysiwygId(props.content.id))
    }
  }

  componentWillUnmount () {
    const { props } = this
    if (props.showTimeline) globalThis.tinymce.remove(this.getWysiwygId(props.content.id))
  }

  handleAllAppChangeLanguage = (data) => {
    const { props, state } = this
    if (state.timelineWysiwyg) {
      const wysiwygId = this.getWysiwygId(props.content.id)
      globalThis.tinymce.remove(wysiwygId)
      globalThis.wysiwyg(wysiwygId, data, this.handleChangeNewComment)
    }
  }

  handleInitWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      this.getWysiwygId(this.props.content.id),
      this.props.user.lang,
      this.handleChangeNewComment,
      handleTinyMceInput,
      handleTinyMceKeyDown,
      handleTinyMceKeyUp,
      handleTinyMceSelectionChange
    )
  }

  getWysiwygId = (contentId) => `#wysiwygTimelineComment${contentId}`

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

  handleChangeNewComment = e => {
    const { props } = this
    props.appContentChangeComment(e, props.content, this.setState.bind(this), props.content.slug)
  }

  handleClickSend = () => {
    const { props, state } = this

    if (!handleInvalidMentionInComment(
      props.memberList,
      state.timelineWysiwyg,
      state.newComment,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnyway()
    }
  }

  handleClickValidateAnyway = async () => {
    const { props, state } = this
    try {
      props.appContentSaveNewComment(
        {
          ...props.content,
          content_id: props.content.id,
          workspace_id: props.content.workspaceId
        },
        state.timelineWysiwyg,
        state.newComment,
        this.setState.bind(this),
        props.content.slug,
        props.user.username,
        props.content.id
      )
    } catch (e) {
      this.sendGlobalFlashMessage(e.message || props.t('Error while saving the comment'))
    }
  }

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInComment: false })

  searchForMentionInQuery = async (query) => {
    return await this.props.searchForMentionInQuery(query, this.props.workspaceId)
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
            invalidMentionList={state.invalidMentionList}
            loggedUser={props.user}
            newComment={state.newComment}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickSend}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            onInitWysiwyg={this.handleInitWysiwyg}
            shouldScrollToBottom={false}
            showInvalidMentionPopup={state.showInvalidMentionPopupInComment}
            showTitle={false}
            timelineData={props.commentList}
            wysiwyg={state.timelineWysiwyg}
            onClickCancelSave={this.handleCancelSave}
            onClickSaveAnyway={this.handleClickValidateAnyway}
            searchForMentionInQuery={this.searchForMentionInQuery}
            workspaceId={props.workspaceId}
          />
        )}
      </div>
    )
  }
}
export default translate()(appContentFactory(TracimComponent(FeedItemWithPreview)))

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
  memberList: PropTypes.array,
  modifiedDate: PropTypes.string,
  onEventClicked: PropTypes.func,
  reactionList: PropTypes.array,
  showTimeline: PropTypes.bool,
  user: PropTypes.object
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
  memberList: [],
  modifiedDate: '',
  reactionList: [],
  showTimeline: false,
  user: {}
}
