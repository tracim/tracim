import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import FeedItemHeader from '../component/FeedItem/FeedItemHeader.jsx'
import FeedItemFooter from '../component/FeedItem/FeedItemFooter.jsx'
import Preview, { LINK_TYPE } from '../component/FeedItem/Preview.jsx'

import {
  findUserRoleIdInWorkspace,
  FETCH_CONFIG
} from '../util/helper.js'

import {
  appContentFactory,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  TRANSLATION_STATE,
  ROLE,
  ROLE_LIST,
  handleInvalidMentionInComment,
  handleTranslateComment,
  handleTranslateHtmlContent,
  getDefaultTranslationState,
  PAGE,
  Comment,
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
      isDiscussionDisplayed: false,
      discussionToggleButtonLabel: '',
      newComment: '',
      translatedRawContent: '',
      contentTranslationState: this.getInitialTranslationState(props),
      translationStateByCommentId: {},
      newCommentAsFileList: [],
      showInvalidMentionPopupInComment: false,
      timelineWysiwyg: false,
      translationTargetLanguageCode: props.user.lang
    }
  }

  getFirstComment () {
    // NOTE - RJ - 2021-04-09 is commentList[0] either the first comment (in recent activities)
    // or the second comment (in publications), and then firstComment is the first comment
    const { props } = this
    return props.inRecentActivities ? props.commentList[0] : props.content.firstComment
  }

  getInitialTranslationState (props) {
    return (
      ((props.content.type === CONTENT_TYPE.THREAD && this.getFirstComment()) || props.content.type === CONTENT_TYPE.HTML_DOCUMENT)
        ? getDefaultTranslationState(props.system.config)
        : TRANSLATION_STATE.DISABLED
    )
  }

  componentDidUpdate (prevProps, prevState) {
    const { props, state } = this

    if (state.contentTranslationState === TRANSLATION_STATE.DISABLED && getDefaultTranslationState(props.system.config) !== TRANSLATION_STATE.DISABLED) {
      const contentTranslationState = this.getInitialTranslationState(props)
      if (contentTranslationState !== state.contentTranslationState) {
        this.setState({ contentTranslationState })
      }
    }

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
      this.props.i18n.language,
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
      comment.content_id,
      comment.content_type
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

  searchForMentionOrLinkInQuery = async (query) => {
    return await this.props.searchForMentionOrLinkInQuery(query, this.props.workspaceId)
  }

  handleTranslateComment = () => {
    const { props, state } = this
    handleTranslateComment(
      FETCH_CONFIG.apiUrl,
      props.content.workspaceId,
      props.content.id,
      this.getFirstComment().content_id,
      state.translationTargetLanguageCode,
      props.system.config,
      ({ translatedRawContent = state.translatedRawContent, translationState }) => {
        this.setState({ translatedRawContent, contentTranslationState: translationState })
      }
    )
  }

  handleTranslateHtmlDocument = () => {
    const { props, state } = this
    handleTranslateHtmlContent(
      FETCH_CONFIG.apiUrl,
      props.content.workspaceId,
      props.content.id,
      props.content.currentRevisionId,
      state.translationTargetLanguageCode,
      props.system.config,
      ({ translatedRawContent = state.translatedRawContent, translationState }) => {
        this.setState({ translatedRawContent, contentTranslationState: translationState })
      }
    )
  }

  handleRestoreContentTranslation = () => {
    this.setState({
      contentTranslationState: getDefaultTranslationState(this.props.system.config)
    })
  }

  handleRestoreCommentTranslation = (commentId) => {
    const commentTranslationState = this.getCommentTranslationState(commentId)
    this.setState(prev => ({
      translationStateByCommentId: {
        ...prev.translationStateByCommentId,
        [commentId]: {
          ...commentTranslationState,
          translationState: getDefaultTranslationState(this.props.system.config)
        }
      }
    }))
  }

  commentSetState = (commentId, { translatedRawContent, translationState }) => {
    this.setState(prev => {
      const commentTranslationState = this.getCommentTranslationState(commentId)
      return {
        translationStateByCommentId: {
          ...prev.translationStateByCommentId,
          [commentId]: {
            ...commentTranslationState,
            translatedRawContent: translatedRawContent || commentTranslationState.translatedRawContent,
            translationState: translationState || commentTranslationState.translationState
          }
        }
      }
    })
  }

  getCommentTranslationState (commentId) {
    const { props } = this
    return this.state.translationStateByCommentId[commentId] || {
      translationState: getDefaultTranslationState(props.system.config),
      translatedRawContent: null
    }
  }

  getTimelineData () {
    const { props, state } = this
    const defaultTranslationState = getDefaultTranslationState(props.system.config)
    return props.commentList.map(
      comment => {
        const commentTranslationState = state.translationStateByCommentId[comment.content_id] || {}
        return {
          ...comment,
          translationState: commentTranslationState.translationState || defaultTranslationState,
          translatedRawContent: commentTranslationState.translatedRawContent
        }
      }
    )
  }

  handleChangeTranslationTargetLanguageCode = (translationTargetLanguageCode) => {
    this.setState({ translationTargetLanguageCode })
  }

  handleClickToggleComments = () => {
    this.setState(previousState => ({
      isDiscussionDisplayed: !previousState.isDiscussionDisplayed
    }))
  }

  getDiscussionToggleButtonLabel = () => {
    const { props, state } = this
    if (props.commentList.length > 0) {
      return state.isDiscussionDisplayed
        ? props.t('Hide discussion')
        : `${props.t('Show discussion')} (${props.commentList.length})`
    } else {
      return state.isDiscussionDisplayed
        ? props.t('Hide comment area')
        : props.t('Comment')
    }
  }

  render () {
    const { props, state } = this

    let previewTitle = ''
    if (props.inRecentActivities) {
      previewTitle = props.isPublication
        ? props.t('Show in news')
        : props.t('Open_action')
    } else {
      if (props.previewLinkType !== LINK_TYPE.NONE) {
        previewTitle = props.t('Download {{filename}}', { filename: props.content.fileName, interpolation: { escapeValue: false } })
      }
    }

    const shouldShowComment = props.content.type === CONTENT_TYPE.THREAD
    const commentToShow = (
      shouldShowComment
        ? (
          props.isPublication
            ? (
              props.content.type === CONTENT_TYPE.FILE
                ? props.content
                : this.getFirstComment()
            )
            : this.getFirstComment()
        )
        : null
    )

    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(
      props.user.userId,
      (props.workspaceList.find(workspace => workspace.id === props.content.workspaceId) || {}).memberList || [],
      ROLE_LIST
    ) || ROLE.reader.id

    const loggedUser = {
      ...props.user,
      userRoleIdInWorkspace
    }

    return (
      <div className='feedItem' ref={props.innerRef}>
        <FeedItemHeader
          allowEdition={props.allowEdition}
          breadcrumbsList={props.breadcrumbsList}
          contentAvailable={props.contentAvailable}
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
          onClickEdit={props.onClickEdit}
          workspaceId={props.workspaceId}
          titleLink={props.titleLink}
        />
        {props.contentAvailable && (
          <>
            {(shouldShowComment
              ? (commentToShow &&
                <Comment
                  isPublication
                  customClass='feedItem__publication'
                  apiUrl={FETCH_CONFIG.apiUrl}
                  contentId={Number(props.content.id)}
                  apiContent={props.content}
                  workspaceId={Number(props.workspaceId)}
                  author={commentToShow.author}
                  loggedUser={loggedUser}
                  created={commentToShow.created || commentToShow.created_raw || commentToShow.createdRaw}
                  text={
                    state.contentTranslationState === TRANSLATION_STATE.TRANSLATED
                      ? state.translatedRawContent
                      : commentToShow.raw_content
                  }
                  fromMe={props.user.userId === commentToShow.author.user_id}
                  onClickTranslate={this.handleTranslateComment}
                  onClickRestore={this.handleRestoreContentTranslation}
                  translationState={state.contentTranslationState}
                  translationTargetLanguageList={props.system.config.translation_service__target_languages}
                  translationTargetLanguageCode={state.translationTargetLanguageCode}
                  onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
                  onClickToggleCommentList={this.handleClickToggleComments}
                  discussionToggleButtonLabel={this.getDiscussionToggleButtonLabel()}
                  showTimeline={props.showTimeline}
                />
              )
              : (
                <div className='feedItem__content' title={previewTitle}>
                  <Preview
                    fallbackToAttachedFile={props.isPublication && props.content.type === CONTENT_TYPE.FILE}
                    content={
                      state.contentTranslationState === TRANSLATION_STATE.TRANSLATED
                        ? { ...props.content, translatedRawContent: state.translatedRawContent }
                        : props.content
                    }
                    linkType={props.previewLinkType}
                    link={props.previewLink}
                  />
                  <FeedItemFooter
                    onClickTranslate={this.handleTranslateHtmlDocument}
                    onClickRestore={this.handleRestoreContentTranslation}
                    translationState={state.contentTranslationState}
                    translationTargetLanguageList={props.system.config.translation_service__target_languages}
                    translationTargetLanguageCode={state.translationTargetLanguageCode}
                    onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
                    content={props.content}
                    onClickToggleCommentList={this.handleClickToggleComments}
                    discussionToggleButtonLabel={this.getDiscussionToggleButtonLabel()}
                    showTimeline={props.showTimeline}
                    isPublication={props.isPublication}
                  />
                </div>
              )
            )}
            {props.showTimeline && state.isDiscussionDisplayed && (
              <Timeline
                apiUrl={FETCH_CONFIG.apiUrl}
                customClass='feedItem__timeline'
                customColor={props.customColor}
                id={props.content.id}
                invalidMentionList={state.invalidMentionList}
                loggedUser={loggedUser}
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
                timelineData={this.getTimelineData()}
                wysiwyg={state.timelineWysiwyg}
                onClickCancelSave={this.handleCancelSave}
                onClickOpenFileComment={this.handleClickOpenFileComment}
                onClickSaveAnyway={this.handleClickValidateAnyway}
                searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
                workspaceId={props.workspaceId}
                onClickTranslateComment={(
                  comment => handleTranslateComment(
                    FETCH_CONFIG.apiUrl,
                    props.content.workspaceId,
                    props.content.id,
                    comment.content_id,
                    state.translationTargetLanguageCode,
                    props.system.config,
                    (...args) => this.commentSetState(comment.content_id, ...args)
                  )
                )}
                onClickRestoreComment={comment => this.handleRestoreCommentTranslation(comment.content_id)}
                translationTargetLanguageList={props.system.config.translation_service__target_languages}
                translationTargetLanguageCode={state.translationTargetLanguageCode}
                onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
              />
            )}
          </>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({ system, user, currentWorkspace, workspaceList }) => ({ system, user, currentWorkspace, workspaceList })
const FeedItemWithPreviewWithoutRef = translate()(appContentFactory(withRouter(TracimComponent(connect(mapStateToProps)(FeedItemWithPreview)))))
const FeedItemWithPreviewWithRef = React.forwardRef((props, ref) => {
  return <FeedItemWithPreviewWithoutRef innerRef={ref} {...props} />
})
export default FeedItemWithPreviewWithRef
export { LINK_TYPE }

FeedItemWithPreview.propTypes = {
  content: PropTypes.object.isRequired,
  contentAvailable: PropTypes.bool.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  isPublication: PropTypes.bool.isRequired,
  inRecentActivities: PropTypes.bool.isRequired,
  allowEdition: PropTypes.bool,
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
  onClickEdit: PropTypes.func,
  reactionList: PropTypes.array,
  showTimeline: PropTypes.bool,
  titleLink: PropTypes.string,
  previewLink: PropTypes.string,
  previewLinkType: PropTypes.oneOf(Object.values(LINK_TYPE))
}

FeedItemWithPreview.defaultProps = {
  allowEdition: false,
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
  onClickEdit: () => { },
  reactionList: [],
  showTimeline: false,
  previewLinkType: LINK_TYPE.OPEN_IN_APP,
  titleLink: null,
  previewLink: null
}
