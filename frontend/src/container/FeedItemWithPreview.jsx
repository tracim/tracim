import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import FeedItemHeader from '../component/FeedItem/FeedItemHeader.jsx'
import FeedItemFooter from '../component/FeedItem/FeedItemFooter.jsx'
import Preview, { LINK_TYPE } from '../component/FeedItem/Preview.jsx'
import { FETCH_CONFIG } from '../util/helper.js'
import {
  appContentFactory,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  CONTENT_TYPE,
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
    this.props.appContentAddCommentAsFile(fileToUploadList, this.setState.bind(this))
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

    const title = (
      props.inRecentActivities
        ? (
          props.isPublication
            ? props.t('Show in publications')
            : props.t('Open_action')
        )
        : props.t('Download {{filename}}', { filename: props.content.fileName })
    )

    return (
      <div className='feedItem' ref={props.innerRef}>
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
          titleLink={props.titleLink}
        />
        <div className='feedItem__content' title={title}>
          <Preview
            fallbackToAttachedFile={props.isPublication && props.content.type === CONTENT_TYPE.FILE}
            content={props.content}
            linkType={props.previewLinkType}
            link={props.previewLink}
          />
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

const FeedItemWithPreviewWithoutRef = translate()(appContentFactory(withRouter(TracimComponent(FeedItemWithPreview))))
const FeedItemWithPreviewWithRef = React.forwardRef((props, ref) => {
  return <FeedItemWithPreviewWithoutRef innerRef={ref} {...props} />
})
export default FeedItemWithPreviewWithRef
export { LINK_TYPE }

FeedItemWithPreview.propTypes = {
  content: PropTypes.object.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  breadcrumbsList: PropTypes.array,
  commentList: PropTypes.array,
  customColor: PropTypes.string,
  eventList: PropTypes.array,
  isPublication: PropTypes.bool.isRequired,
  inRecentActivities: PropTypes.bool.isRequired,
  lastModificationEntityType: PropTypes.string,
  lastModificationSubEntityType: PropTypes.string,
  lastModificationType: PropTypes.string,
  lastModifier: PropTypes.object,
  memberList: PropTypes.array,
  modifiedDate: PropTypes.string,
  onEventClicked: PropTypes.func,
  reactionList: PropTypes.array,
  showTimeline: PropTypes.bool,
  user: PropTypes.object,
  titleLink: PropTypes.string,
  previewLink: PropTypes.string,
  previewLinkType: PropTypes.oneOf(Object.values(LINK_TYPE))
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
  user: {},
  previewLinkType: LINK_TYPE.OPEN_IN_APP,
  titleLink: null,
  previewLink: null
}
