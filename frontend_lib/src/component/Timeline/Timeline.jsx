import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Radium from 'radium'
import i18n from '../../i18n.js'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import Comment from './Comment.jsx'
import Revision from './Revision.jsx'
import {
  PAGE,
  ROLE,
  TIMELINE_TYPE,
  darkenColor,
  displayDistanceDate,
  formatAbsoluteDate
} from '../../helper.js'
import {
  DEFAULT_ROLE_LIST,
  replaceHTMLElementWithMention
} from '../../mentionOrLink.js'
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

  handleClickValidateEditComment = (comment, commentId, parentId) => {
    const { props } = this
    this.setState({
      invalidMentionList: [],
      showEditCommentPopup: false,
      showInvalidMentionPopupInComment: false
    })
    props.onClickEditComment(comment, commentId, parentId)
  }

  render () {
    const { props, state } = this

    if (!Array.isArray(props.timelineData)) {
      console.error('Error in Timeline.jsx, props.timelineData is not an array. timelineData: ', props.timelineData)
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
          isLastItemAddedFromCurrentToken={props.isLastTimelineItemCurrentToken}
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
                    creationDate={content.created_raw || content.created}
                    modificationDate={content.modified}
                    text={content.translationState === TRANSLATION_STATE.TRANSLATED ? content.translatedRawContent : content.raw_content}
                    fromMe={props.loggedUser.userId === content.author.user_id}
                    key={`comment_${content.content_id}`}
                    onClickTranslate={() => { props.onClickTranslateComment(content) }}
                    onClickRestore={() => { props.onClickRestoreComment(content) }}
                    translationState={content.translationState}
                    onChangeTranslationTargetLanguageCode={languageCode => {
                      props.onClickTranslateComment(content, languageCode)
                      props.onChangeTranslationTargetLanguageCode(languageCode)
                    }}
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

        {state.showEditCommentPopup && (
          <EditCommentPopup
            apiUrl={props.apiUrl}
            codeLanguageList={props.codeLanguageList}
            comment={replaceHTMLElementWithMention(
              DEFAULT_ROLE_LIST,
              props.memberList,
              state.newComment.raw_content
            )}
            commentId={state.newComment.content_id}
            customColor={props.customColor}
            loggedUserLanguage={props.loggedUser.lang}
            memberList={props.memberList}
            onClickClose={() => this.setState({ showEditCommentPopup: false })}
            onClickValidate={this.handleClickValidateEditComment}
            parentId={state.newComment.parent_id}
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

        {props.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && !props.showParticipateButton && (
          <div className='timeline__texteditor'>
            <CommentArea
              apiUrl={props.apiUrl}
              contentId={props.contentId}
              contentType={props.contentType}
              onClickSubmit={props.onClickSubmit}
              workspaceId={props.workspaceId}
              // End of required props /////////////////////////////////////////
              codeLanguageList={props.codeLanguageList}
              customClass={props.customClass}
              customColor={props.customColor}
              disableComment={disableComment}
              invalidMentionList={props.invalidMentionList}
              isFileCommentLoading={props.isFileCommentLoading}
              language={props.loggedUser.lang}
              memberList={props.memberList}
              placeholder={props.t('Write an answer...')}
              roleList={props.roleList}
              submitLabel={props.t('Send')}
            />
          </div>
        )}

        {props.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && props.showParticipateButton && (
          <Link
            style={{
              '--appTypeColor': props.customColor,
              '--appTypeDarkColor': darkenColor(props.customColor)
            }}
            className='timeline__participate'
            to={PAGE.CONTENT(props.contentId)}
          >
            <i className='fa-fw fas fa-bullhorn' />
            {props.t('Participate')}
          </Link>
        )}
      </div>
    )
  }
}

export default translate()(Radium(TracimComponent(Timeline)))

Timeline.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  loggedUser: PropTypes.object.isRequired,
  onClickRestoreComment: PropTypes.func.isRequired,
  onClickSubmit: PropTypes.func.isRequired,
  onClickTranslateComment: PropTypes.func.isRequired,
  timelineData: PropTypes.array.isRequired,
  translationTargetLanguageCode: PropTypes.string.isRequired,
  translationTargetLanguageList: PropTypes.arrayOf(PropTypes.object).isRequired,
  workspaceId: PropTypes.number.isRequired,
  // End of required props /////////////////////////////////////////////////////
  allowClickOnRevision: PropTypes.bool,
  availableStatusList: PropTypes.array,
  canLoadMoreTimelineItems: PropTypes.func,
  codeLanguageList: PropTypes.array,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  deprecatedStatus: PropTypes.object,
  disableComment: PropTypes.bool,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  invalidMentionList: PropTypes.array,
  isArchived: PropTypes.bool,
  isDeleted: PropTypes.bool,
  isDeprecated: PropTypes.bool,
  isFileCommentLoading: PropTypes.bool,
  isLastTimelineItemCurrentToken: PropTypes.bool,
  loading: PropTypes.bool,
  memberList: PropTypes.array,
  onChangeTranslationTargetLanguageCode: PropTypes.func,
  onClickDeleteComment: PropTypes.func,
  onClickEditComment: PropTypes.func,
  onClickOpenFileComment: PropTypes.func,
  onClickRestoreArchived: PropTypes.func,
  onClickRestoreDeleted: PropTypes.func,
  onClickRevisionBtn: PropTypes.func,
  onClickShowMoreTimelineItems: PropTypes.func,
  roleList: PropTypes.array,
  shouldScrollToBottom: PropTypes.bool,
  showParticipateButton: PropTypes.bool
}

Timeline.defaultProps = {
  allowClickOnRevision: true,
  availableStatusList: [],
  canLoadMoreTimelineItems: () => false,
  codeLanguageList: [],
  customClass: '',
  customColor: '',
  deprecatedStatus: {
    faIcon: ''
  },
  disableComment: false,
  id: '',
  invalidMentionList: [],
  isArchived: false,
  isDeleted: false,
  isDeprecated: false,
  isFileCommentLoading: false,
  isLastTimelineItemCurrentToken: false,
  loading: false,
  memberList: [],
  onChangeTranslationTargetLanguageCode: () => { },
  onClickDeleteComment: () => { },
  onClickEditComment: () => { },
  onClickOpenFileComment: () => { },
  onClickRestoreComment: content => { },
  onClickRevisionBtn: () => { },
  onClickShowMoreTimelineItems: () => { },
  onClickTranslateComment: content => { },
  roleList: [],
  shouldScrollToBottom: true,
  showParticipateButton: false,
  timelineData: []
}
