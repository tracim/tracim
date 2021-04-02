import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import FeedItemHeader from '../component/FeedItem/FeedItemHeader.jsx'
import FeedItemFooter from '../component/FeedItem/FeedItemFooter.jsx'
import Preview from '../component/FeedItem/Preview.jsx'
import { CONTENT_NAMESPACE, FETCH_CONFIG } from '../util/helper.js'
import {
  appContentFactory,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  handleInvalidMentionInComment,
  PAGE,
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
      newCommentAsFileList: [],
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

  handleAddCommentAsFile = fileToUploadList => {
    this.props.appContentAddCommentAsFile(fileToUploadList, CONTENT_NAMESPACE.PUBLICATION, this.setState.bind(this))
  }

  handleRemoveCommentAsFile = fileToRemove => {
    this.props.appContentRemoveCommentAsFile(fileToRemove, this.setState.bind(this))
  }

  handleClickEditComment = (comment) => {
    const { props } = this
    props.appContentEditComment(
      props.content.workspaceId,
      comment.parent_id,
      comment.content_id,
      props.user.username
    )
  }

  handleClickDeleteComment = async (comment) => {
    const { props } = this
    props.appContentDeleteComment(
      props.content.workspaceId,
      comment.parent_id,
      comment.content_id
    )
  }

  handleClickOpenFileComment = (comment) => {
    const { props } = this
    props.history.push(PAGE.WORKSPACE.CONTENT(
      props.content.workspaceId,
      CONTENT_TYPE.FILE,
      comment.content_id
    ))
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
        state.newCommentAsFileList,
        this.setState.bind(this),
        props.content.type,
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
          isPublication={props.isPublication}
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
          <FeedItemFooter content={props.content} />
        </div>
        {props.showTimeline && (
          <Timeline
            apiUrl={FETCH_CONFIG.apiUrl}
            customClass='feedItem__timeline'
            customColor={props.customColor}
            id={props.content.id}
            invalidMentionList={state.invalidMentionList}
            loggedUser={props.user}
            memberList={props.memberList}
            newComment={state.newComment}
            newCommentAsFileList={state.newCommentAsFileList}
            onChangeNewComment={this.handleChangeNewComment}
            onRemoveCommentAsFile={this.handleRemoveCommentAsFile}
            onClickDeleteComment={this.handleClickDeleteComment}
            onClickEditComment={this.handleClickEditComment}
            onClickValidateNewCommentBtn={this.handleClickSend}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            onInitWysiwyg={this.handleInitWysiwyg}
            onValidateCommentFileToUpload={this.handleAddCommentAsFile}
            shouldScrollToBottom={false}
            showInvalidMentionPopup={state.showInvalidMentionPopupInComment}
            showTitle={false}
            timelineData={props.commentList}
            wysiwyg={state.timelineWysiwyg}
            onClickCancelSave={this.handleCancelSave}
            onClickOpenFileComment={this.handleClickOpenFileComment}
            onClickSaveAnyway={this.handleClickValidateAnyway}
            searchForMentionInQuery={this.searchForMentionInQuery}
            workspaceId={props.workspaceId}
          />
        )}
      </div>
    )
  }
}
export default translate()(appContentFactory(withRouter(TracimComponent(FeedItemWithPreview))))

FeedItemWithPreview.propTypes = {
  content: PropTypes.object.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  breadcrumbsList: PropTypes.array,
  commentList: PropTypes.array,
  customColor: PropTypes.string,
  eventList: PropTypes.array,
  isPublication: PropTypes.bool,
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
  isPublication: false,
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
