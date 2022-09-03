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
  COLORS,
  Comment,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  getDefaultTranslationState,
  handleInvalidMentionInComment,
  handleTranslateComment,
  handleTranslateHtmlContent,
  PAGE,
  ROLE,
  ROLE_LIST,
  Timeline,
  tinymceRemove,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TracimComponent,
  TRANSLATION_STATE
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
      translatedRawContent: '',
      contentTranslationState: this.getInitialTranslationState(props),
      translationStateByCommentId: {},
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

    if (props.showCommentList && prevState.timelineWysiwyg && !state.timelineWysiwyg) {
      tinymceRemove(this.getWysiwygId(props.content.id))
    }
  }

  componentWillUnmount () {
    const { props } = this
    if (props.showCommentList) tinymceRemove(this.getWysiwygId(props.content.id))
  }

  handleAllAppChangeLanguage = (data) => {
    const { props, state } = this
    if (state.timelineWysiwyg) {
      const wysiwygId = this.getWysiwygId(props.content.id)
      tinymceRemove(wysiwygId)
      globalThis.wysiwyg(wysiwygId, data, this.handleChangeNewComment)
    }
  }

  getWysiwygId = (contentId) => `#wysiwygTimelineComment${contentId}`

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

  handleChangeNewComment = e => {
    const { props } = this
    props.appContentChangeComment(e, props.content, this.setState.bind(this), props.content.slug)
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

  handleClickSend = (comment, commentAsFileList) => {
    const { props, state } = this
    if (!handleInvalidMentionInComment(
      props.memberList,
      state.timelineWysiwyg,
      comment,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnyway(comment, commentAsFileList)
      return true
    }
    return false
  }

  handleClickValidateAnyway = async (comment, commentAsFileList) => {
    const { props, state } = this
    try {
      props.appContentSaveNewComment(
        {
          ...props.content,
          content_id: props.content.id,
          workspace_id: props.content.workspaceId
        },
        state.timelineWysiwyg,
        comment,
        commentAsFileList,
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

  handleTranslateComment = (languageCode) => {
    const { props, state } = this
    handleTranslateComment(
      FETCH_CONFIG.apiUrl,
      props.content.workspaceId,
      props.content.id,
      this.getFirstComment().content_id,
      languageCode || state.translationTargetLanguageCode,
      props.system.config,
      ({ translatedRawContent = state.translatedRawContent, translationState }) => {
        this.setState({ translatedRawContent, contentTranslationState: translationState })
      }
    )
  }

  handleTranslateHtmlDocument = (languageCode = null) => {
    const { props, state } = this
    handleTranslateHtmlContent(
      FETCH_CONFIG.apiUrl,
      props.content.workspaceId,
      props.content.id,
      props.content.currentRevisionId,
      languageCode || state.translationTargetLanguageCode,
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
    const commentList = props.commentList.map(
      comment => {
        const commentTranslationState = state.translationStateByCommentId[comment.content_id] || {}
        return {
          ...comment,
          timelineType: comment.timelineType || comment.content_type,
          translationState: commentTranslationState.translationState || defaultTranslationState,
          translatedRawContent: commentTranslationState.translatedRawContent
        }
      }
    )
    // INFO - G.B. - 2022-08-23 - For threads, we remove the first element because it's already shown in the preview
    return props.content.type === CONTENT_TYPE.THREAD ? commentList.slice(1) : commentList
  }

  handleChangeTranslationTargetLanguageCode = (translationTargetLanguageCode) => {
    this.setState({ translationTargetLanguageCode })
  }

  handleClickToggleComments = () => {
    this.setState(previousState => ({
      isDiscussionDisplayed: !previousState.isDiscussionDisplayed
    }))
  }

  getDiscussionToggleButtonLabel = (commentList) => {
    const { props, state } = this
    if (commentList.length > 0) {
      return state.isDiscussionDisplayed
        ? props.t('Hide discussion')
        : `${props.t('Show discussion')} (${commentList.length})`
    } else {
      if (props.isPublication) {
        return state.isDiscussionDisplayed
          ? props.t('Hide comment area')
          : props.t('Comment', { context: 'verb' })
      } else return props.t('Participate')
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
        ? this.getFirstComment()
        : null
    )

    const commentList = this.getTimelineData()

    const spaceMemberList = (props.workspaceList.find(workspace => workspace.id === props.content.workspaceId) || { memberList: [] }).memberList

    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(
      props.user.userId,
      spaceMemberList,
      ROLE_LIST
    ) || ROLE.reader.id

    const loggedUser = {
      ...props.user,
      userRoleIdInWorkspace
    }

    const isContentDeleted = props.lastModificationEntityType === TLM_ET.CONTENT && props.lastModificationType === TLM_CET.DELETED

    const contentType = props.isPublication
      ? { label: props.t('Publication'), faIcon: 'fas fa-stream', hexcolor: COLORS.PUBLICATION }
      : (
        props.appList.find(app => app.slug === `contents/${props.content.type}`) ||
        { label: props.t(`No App for content-type ${props.content.type}`), faIcon: 'fas fa-question', hexcolor: '#000000' }
      )

    return (
      <div className='feedItem' ref={props.innerRef}>
        <FeedItemHeader
          allowEdition={props.allowEdition}
          breadcrumbsList={props.breadcrumbsList}
          content={props.content}
          contentAvailable={props.contentAvailable}
          contentType={contentType}
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
        {props.contentAvailable && !isContentDeleted && (
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
                  created={commentToShow.created_raw || commentToShow.createdRaw || commentToShow.created}
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
                  onChangeTranslationTargetLanguageCode={languageCode => {
                    this.handleChangeTranslationTargetLanguageCode(languageCode)
                    this.handleTranslateComment(languageCode)
                  }}
                  onClickToggleCommentList={this.handleClickToggleComments}
                  discussionToggleButtonLabel={this.getDiscussionToggleButtonLabel(commentList)}
                  threadLength={commentList.length}
                  showCommentList={props.showCommentList}
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
                    discussionToggleButtonLabel={this.getDiscussionToggleButtonLabel(commentList)}
                    discussionToggleButtonLabelMobile={commentList.length > 0 ? commentList.length.toString() : ''}
                    showCommentList={props.showCommentList}
                    isPublication={props.isPublication}
                    isCommentListEmpty={commentList.length === 0}
                    customColor={contentType.hexcolor}
                  />
                </div>
              )
            )}
            {props.showCommentList && state.isDiscussionDisplayed && (
              <Timeline
                apiUrl={FETCH_CONFIG.apiUrl}
                contentId={props.content.id}
                contentType={props.content.type}
                customClass='feedItem__timeline'
                customColor={contentType.hexcolor}
                id={props.content.id}
                invalidMentionList={state.invalidMentionList}
                loggedUser={loggedUser}
                memberList={props.memberList}
                onRemoveCommentAsFile={this.handleRemoveCommentAsFile}
                onClickDeleteComment={this.handleClickDeleteComment}
                onClickEditComment={this.handleClickEditComment}
                onClickValidateNewCommentBtn={this.handleClickSend}
                onClickWysiwygBtn={this.handleToggleWysiwyg}
                shouldScrollToBottom={false}
                showInvalidMentionPopup={state.showInvalidMentionPopupInComment}
                timelineData={commentList}
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
                showParticipateButton={props.showParticipateButton}
                wysiwygIdSelector={this.getWysiwygId(props.content.id)}
              />
            )}
          </>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({
  appList,
  system,
  user,
  currentWorkspace,
  workspaceList
}) => ({ appList, system, user, currentWorkspace, workspaceList })
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
  showCommentList: PropTypes.bool,
  titleLink: PropTypes.string,
  previewLink: PropTypes.string,
  previewLinkType: PropTypes.oneOf(Object.values(LINK_TYPE)),
  showParticipateButton: PropTypes.bool
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
  showCommentList: false,
  previewLinkType: LINK_TYPE.OPEN_IN_APP,
  titleLink: null,
  previewLink: null,
  showParticipateButton: false
}
