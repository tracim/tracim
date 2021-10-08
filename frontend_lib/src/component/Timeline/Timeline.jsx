import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Radium from 'radium'
import Comment from './Comment.jsx'
import Revision from './Revision.jsx'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import { ROLE, formatAbsoluteDate, displayDistanceDate, TIMELINE_TYPE } from '../../helper.js'
import { handleInvalidMentionInComment } from '../../mentionOrLink.js'
import { TRANSLATION_STATE } from '../../translation.js'
import PromptMessage from '../PromptMessage/PromptMessage.jsx'
import { CUSTOM_EVENT } from '../../customEvent.js'
import { TracimComponent } from '../../tracimComponent.js'
import CommentArea from './CommentArea.jsx'
import ConfirmPopup from '../ConfirmPopup/ConfirmPopup.jsx'
import ScrollToBottomWrapper from '../ScrollToBottomWrapper/ScrollToBottomWrapper.jsx'
import EditCommentPopup from './EditCommentPopup.jsx'
import IconButton from '../Button/IconButton.jsx'
import Loading from '../Loading/Loading.jsx'

// require('./Timeline.styl') // see https://github.com/tracim/tracim/issues/1156

export class Timeline extends React.Component {
  constructor (props) {
    super(props)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    this.state = {
      commentToDelete: null,
      invalidMentionList: [],
      newComment: {},
      showDeleteCommentPopup: false,
      showEditCommentPopup: false,
      showInvalidMentionPopupInComment: false
    }
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<FrontendLib:Timeline> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    i18n.changeLanguage(data)
  }

  handleToggleDeleteCommentPopup = content => {
    this.setState(prev => ({
      showDeleteCommentPopup: !prev.showDeleteCommentPopup,
      commentToDelete: prev.showDeleteCommentPopup ? null : content
    }))
  }

  handleClickValidateDeleteComment = () => {
    this.props.onClickDeleteComment(this.state.commentToDelete)
    this.setState({
      showDeleteCommentPopup: false,
      commentToDelete: null
    })
  }

  handleClickEditComment = (comment) => {
    this.setState({ showEditCommentPopup: true, newComment: comment })
  }

  handleClickValidateEditComment = async (comment) => {
    const { props } = this
    if (!handleInvalidMentionInComment(
      props.memberList,
      true,
      comment,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnywayEditComment()
    }
  }

  handleClickValidateAnywayEditComment = () => {
    const { props, state } = this
    this.setState({
      invalidMentionList: [],
      showEditCommentPopup: false,
      showInvalidMentionPopupInComment: false
    })
    props.onClickEditComment(state.newComment)
  }

  handleCloseInvalidMentionPopup = () => {
    const { props } = this
    props.showInvalidMentionPopup
      ? props.onClickCancelSave()
      : this.setState({ showInvalidMentionPopupInComment: false })
  }

  handleValidateInvalidMentionPopup = () => {
    const { props } = this
    props.showInvalidMentionPopup
      ? props.onClickSaveAnyway()
      : this.handleClickValidateAnywayEditComment()
  }

  render () {
    const { props, state } = this
    const invalidMentionList = props.invalidMentionList.length ? props.invalidMentionList : state.invalidMentionList
    const showInvalidMentionPopup = props.showInvalidMentionPopup || state.showInvalidMentionPopupInComment

    if (!Array.isArray(props.timelineData)) {
      console.log('Error in Timeline.jsx, props.timelineData is not an array. timelineData: ', props.timelineData)
      return null
    }

    const disableComment = props.disableComment || props.loading

    return (
      <div className={classnames('timeline')}>
        <div className='timeline__warning'>
          {props.isDeprecated && !props.isArchived && !props.isDeleted && (
            <PromptMessage
              msg={props.t('This content is deprecated')}
              icon={props.deprecatedStatus.faIcon}
            />
          )}

          {props.isArchived && (
            <PromptMessage
              msg={props.t('This content is archived')}
              btnType='button'
              icon='archive'
              btnLabel={props.t('Restore')}
              onClickBtn={props.onClickRestoreArchived}
            />
          )}

          {props.isDeleted && (
            <PromptMessage
              msg={props.t('This content is deleted')}
              btnType='button'
              icon='far fa-trash-alt'
              btnLabel={props.t('Restore')}
              onClickBtn={props.onClickRestoreDeleted}
            />
          )}
        </div>

        <ScrollToBottomWrapper
          customClass={classnames(`${props.customClass}__messagelist`, 'timeline__messagelist')}
          shouldScrollToBottom={props.shouldScrollToBottom}
          isLastItemAddedFromCurrentToken={props.isLastTimelineItemCurrentToken && props.newComment === ''}
        >
          {!props.loading && props.canLoadMoreTimelineItems() && (
            <IconButton
              onClick={props.onClickShowMoreTimelineItems}
              text={props.t('See more')}
              icon='fas fa-chevron-up'
              dataCy='showMoreTimelineItemsBtn'
              customClass='timeline__messagelist__showMoreButton'
            />
          )}
          {props.loading ? <Loading /> : props.timelineData.map(content => {
            switch (content.timelineType) {
              case TIMELINE_TYPE.COMMENT:
              case TIMELINE_TYPE.COMMENT_AS_FILE:
                return (
                  <Comment
                    isPublication={false}
                    customClass={`${props.customClass}__comment`}
                    customColor={props.customColor}
                    apiUrl={props.apiUrl}
                    contentId={Number(content.content_id)}
                    apiContent={content}
                    workspaceId={Number(props.workspaceId)}
                    author={content.author}
                    loggedUser={props.loggedUser}
                    created={content.created_raw || content.created}
                    text={content.translationState === TRANSLATION_STATE.TRANSLATED ? content.translatedRawContent : content.raw_content}
                    fromMe={props.loggedUser.userId === content.author.user_id}
                    key={`comment_${content.content_id}`}
                    onClickTranslate={() => { props.onClickTranslateComment(content) }}
                    onClickRestore={() => { props.onClickRestoreComment(content) }}
                    translationState={content.translationState}
                    onChangeTranslationTargetLanguageCode={props.onChangeTranslationTargetLanguageCode}
                    translationTargetLanguageCode={props.translationTargetLanguageCode}
                    translationTargetLanguageList={props.translationTargetLanguageList}
                    onClickEditComment={() => this.handleClickEditComment(content)}
                    onClickDeleteComment={() => this.handleToggleDeleteCommentPopup(content)}
                    onClickOpenFileComment={() => props.onClickOpenFileComment(content)}
                  />
                )
              case TIMELINE_TYPE.REVISION:
                return (
                  <Revision
                    customClass={props.customClass}
                    customColor={props.customColor}
                    revisionType={content.revision_type}
                    createdFormated={formatAbsoluteDate(content.created_raw, props.loggedUser.lang)}
                    createdDistance={displayDistanceDate(content.created_raw, props.loggedUser.lang)}
                    versionNumber={content.version_number}
                    status={props.availableStatusList.find(status => status.slug === content.status)}
                    authorPublicName={content.author.public_name}
                    allowClickOnRevision={props.allowClickOnRevision}
                    onClickRevision={() => props.onClickRevisionBtn(content)}
                    key={`revision_${content.revision_id}`}
                  />
                )
            }
          })}
        </ScrollToBottomWrapper>

        {showInvalidMentionPopup && (
          <ConfirmPopup
            onConfirm={this.handleCloseInvalidMentionPopup}
            onClose={this.handleCloseInvalidMentionPopup}
            onCancel={this.handleValidateInvalidMentionPopup}
            msg={
              <>
                {props.t('Your text contains mentions that do not match any member of this space:')}
                <div className='timeline__texteditor__mentions'>
                  {invalidMentionList.join(', ')}
                </div>
              </>
            }
            confirmLabel={props.t('Edit')}
            confirmIcon='far fa-fw fa-edit'
            cancelLabel={props.t('Validate anyway')}
            cancelIcon='fas fa-fw fa-check'
          />
        )}

        {state.showEditCommentPopup && (
          <EditCommentPopup
            apiUrl={props.apiUrl}
            comment={state.newComment.raw_content}
            commentId={state.newComment.content_id}
            customColor={props.customColor}
            loggedUserLanguage={props.loggedUser.lang}
            onClickValidate={this.handleClickValidateEditComment}
            onClickClose={() => this.setState({ showEditCommentPopup: false })}
            workspaceId={props.workspaceId}
          />
        )}

        {state.showDeleteCommentPopup && (
          <ConfirmPopup
            customColor={props.customColor}
            confirmLabel={props.t('Delete')}
            confirmIcon='far fa-trash-alt'
            onConfirm={this.handleClickValidateDeleteComment}
            onCancel={this.handleToggleDeleteCommentPopup}
          />
        )}

        {props.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
          <div className='timeline__texteditor'>
            <CommentArea
              contentId={props.contentId}
              contentType={props.contentType}
              id={`wysiwygTimelineComment${props.id}`}
              apiUrl={props.apiUrl}
              newComment={props.newComment}
              disableComment={disableComment}
              wysiwyg={props.wysiwyg}
              searchForMentionOrLinkInQuery={props.searchForMentionOrLinkInQuery}
              wysiwygId={props.wysiwygId}
              customClass={props.customClass}
              customColor={props.customColor}
              onClickWysiwygBtn={props.onClickWysiwygBtn}
              onRemoveCommentAsFile={props.onRemoveCommentAsFile}
              workspaceId={props.workspaceId}
              onValidateCommentFileToUpload={props.onValidateCommentFileToUpload}
              onClickValidateNewCommentBtn={props.onClickValidateNewCommentBtn}
              lang={props.loggedUser.lang}
            />
          </div>
        )}
      </div>
    )
  }
}

export default translate()(Radium(TracimComponent(Timeline)))

Timeline.propTypes = {
  timelineData: PropTypes.array.isRequired,
  apiUrl: PropTypes.string.isRequired,
  workspaceId: PropTypes.number.isRequired,
  newComment: PropTypes.string.isRequired,
  onClickValidateNewCommentBtn: PropTypes.func.isRequired,
  availableStatusList: PropTypes.array,
  deprecatedStatus: PropTypes.object,
  disableComment: PropTypes.bool,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isDeprecated: PropTypes.bool,
  loggedUser: PropTypes.object.isRequired,
  memberList: PropTypes.array,
  wysiwyg: PropTypes.bool,
  onClickWysiwygBtn: PropTypes.func,
  onClickRevisionBtn: PropTypes.func,
  allowClickOnRevision: PropTypes.bool,
  invalidMentionList: PropTypes.array,
  shouldScrollToBottom: PropTypes.bool,
  isLastTimelineItemCurrentToken: PropTypes.bool,
  rightPartOpen: PropTypes.bool,
  isArchived: PropTypes.bool,
  onClickRestoreArchived: PropTypes.func,
  isDeleted: PropTypes.bool,
  onClickCancelSave: PropTypes.func,
  onClickRestoreDeleted: PropTypes.func,
  onClickSaveAnyway: PropTypes.func,
  searchForMentionOrLinkInQuery: PropTypes.func,
  showInvalidMentionPopup: PropTypes.bool,
  onClickEditComment: PropTypes.func,
  onClickDeleteComment: PropTypes.func,
  onClickOpenFileComment: PropTypes.func,
  onClickTranslateComment: PropTypes.func.isRequired,
  onClickRestoreComment: PropTypes.func.isRequired,
  translationTargetLanguageList: PropTypes.arrayOf(PropTypes.object).isRequired,
  translationTargetLanguageCode: PropTypes.string.isRequired,
  onClickShowMoreTimelineItems: PropTypes.func,
  canLoadMoreTimelineItems: PropTypes.func
}

Timeline.defaultProps = {
  availableStatusList: [],
  deprecatedStatus: {
    faIcon: ''
  },
  disableComment: false,
  customClass: '',
  customColor: '',
  id: '',
  isDeprecated: false,
  memberList: [],
  timelineData: [],
  wysiwyg: false,
  onClickWysiwygBtn: () => { },
  onClickRevisionBtn: () => { },
  allowClickOnRevision: true,
  invalidMentionList: [],
  shouldScrollToBottom: true,
  isLastTimelineItemCurrentToken: false,
  rightPartOpen: false,
  isArchived: false,
  isDeleted: false,
  onClickCancelSave: () => { },
  onClickSaveAnyway: () => { },
  searchForMentionOrLinkInQuery: () => { },
  showInvalidMentionPopup: false,
  onClickTranslateComment: content => { },
  onClickDeleteComment: () => { },
  onClickRestoreComment: content => { },
  onClickEditComment: () => { },
  onClickOpenFileComment: () => { },
  onClickShowMoreTimelineItems: () => { },
  canLoadMoreTimelineItems: () => false
}
