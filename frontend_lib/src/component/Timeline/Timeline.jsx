import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Radium from 'radium'
import Comment from './Comment.jsx'
import Revision from './Revision.jsx'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import { ROLE, formatAbsoluteDate } from '../../helper.js'
import { TRANSLATION_STATE } from '../../translation.js'
import PromptMessage from '../PromptMessage/PromptMessage.jsx'
import { CUSTOM_EVENT } from '../../customEvent.js'
import { TracimComponent } from '../../tracimComponent.js'
import CommentTextArea from './CommentTextArea.jsx'
import ConfirmPopup from '../ConfirmPopup/ConfirmPopup.jsx'
import ScrollToBottomWrapper from '../ScrollToBottomWrapper/ScrollToBottomWrapper.jsx'

// require('./Timeline.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

export class Timeline extends React.Component {
  constructor (props) {
    super(props)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<FrontendLib:Timeline> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    i18n.changeLanguage(data)
  }

  render () {
    const { props } = this

    if (!Array.isArray(props.timelineData)) {
      console.log('Error in Timeline.jsx, props.timelineData is not an array. timelineData: ', props.timelineData)
      return null
    }

    return (
      <div className={classnames('timeline')}>
        {props.showTitle &&
          <div className='timeline__title'>
            {props.t('Timeline')}
          </div>}
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
          itemList={props.timelineData}
          isLastItemAddedFromCurrentToken={props.isLastTimelineItemCurrentToken && props.newComment === ''}
        >
          {props.timelineData.map(content => {
            switch (content.timelineType) {
              case 'comment':
                return (
                  <Comment
                    customClass={props.customClass}
                    customColor={props.customColor}
                    apiUrl={props.apiUrl}
                    contentId={Number(content.content_id)}
                    workspaceId={Number(props.workspaceId)}
                    author={content.author}
                    loggedUserId={Number(props.loggedUser.userId)}
                    createdFormated={formatAbsoluteDate(content.created_raw, props.loggedUser.lang)}
                    createdDistance={content.created}
                    text={content.translationState === TRANSLATION_STATE.TRANSLATED ? content.translatedRawContent : content.raw_content}
                    fromMe={props.loggedUser.userId === content.author.user_id}
                    key={`comment_${content.content_id}`}
                    onClickTranslate={() => { props.onClickTranslateComment(content) }}
                    onClickRestore={() => { props.onClickRestoreComment(content) }}
                    translationState={content.translationState}
                  />
                )
              case 'revision':
                return (
                  <Revision
                    customClass={props.customClass}
                    customColor={props.customColor}
                    revisionType={content.revision_type}
                    createdFormated={formatAbsoluteDate(content.created_raw, props.loggedUser.lang)}
                    createdDistance={content.created}
                    number={content.number}
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

        {props.showInvalidMentionPopup && (
          <ConfirmPopup
            onConfirm={props.onClickCancelSave}
            onClose={props.onClickCancelSave}
            onCancel={props.onClickSaveAnyway}
            msg={
              <>
                {props.t('Your text contains mentions that do not match any member of this space:')}
                <div className='timeline__texteditor__mentions'>
                  {props.invalidMentionList.join(', ')}
                </div>
              </>
            }
            confirmLabel={props.t('Edit')}
            cancelLabel={props.t('Validate anyway')}
          />
        )}

        {props.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
          <form className={classnames(`${props.customClass}__texteditor`, 'timeline__texteditor')}>
            <div
              className={classnames(
                `${props.customClass}__texteditor__textinput`,
                'timeline__texteditor__textinput'
              )}
            >
              <CommentTextArea
                id='wysiwygTimelineComment'
                apiUrl={props.apiUrl}
                onChangeNewComment={props.onChangeNewComment}
                newComment={props.newComment}
                disableComment={props.disableComment}
                wysiwyg={props.wysiwyg}
                searchForMentionInQuery={props.searchForMentionInQuery}
                onInitWysiwyg={props.onInitWysiwyg}
              />
            </div>

            <div className={classnames(`${props.customClass}__texteditor__wrapper`, 'timeline__texteditor__wrapper')}>
              <div className={classnames(`${props.customClass}__texteditor__advancedtext`, 'timeline__texteditor__advancedtext')}>
                <button
                  type='button'
                  className={classnames(
                    `${props.customClass}__texteditor__advancedtext__btn timeline__texteditor__advancedtext__btn`
                  )}
                  onClick={props.onClickWysiwygBtn}
                  disabled={props.disableComment}
                  key='timeline__comment__advancedtext'
                >
                  {props.wysiwyg ? props.t('Simple edition') : props.t('Advanced edition')}
                </button>
              </div>

              <div className={classnames(`${props.customClass}__texteditor__submit`, 'timeline__texteditor__submit')}>
                <button
                  type='button'
                  className={classnames(`${props.customClass}__texteditor__submit__btn `, 'timeline__texteditor__submit__btn btn highlightBtn')}
                  onClick={props.onClickValidateNewCommentBtn}
                  disabled={props.disableComment || props.newComment === ''}
                  style={{
                    backgroundColor: props.customColor,
                    color: '#fdfdfd',
                    ':hover': {
                      backgroundColor: color(props.customColor).darken(0.15).hex()
                    }
                  }}
                  key='timeline__comment__send'
                >
                  {props.t('Send')}
                  <div
                    className={classnames(`${props.customClass}__texteditor__submit__btn__icon`, 'timeline__texteditor__submit__btn__icon')}
                  >
                    <i className='far fa-paper-plane' />
                  </div>
                </button>
              </div>
            </div>
          </form>
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
  onChangeNewComment: PropTypes.func.isRequired,
  onClickValidateNewCommentBtn: PropTypes.func.isRequired,
  disableComment: PropTypes.bool,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  loggedUser: PropTypes.object,
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
  showTitle: PropTypes.bool,
  searchForMentionInQuery: PropTypes.func,
  showInvalidMentionPopup: PropTypes.bool,
  onClickTranslateComment: PropTypes.func,
  onClickRestoreComment: PropTypes.func
}

Timeline.defaultProps = {
  disableComment: false,
  customClass: '',
  customColor: '',
  loggedUser: {
    userId: '',
    name: '',
    userRoleIdInWorkspace: ROLE.reader.id
  },
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
  showTitle: true,
  searchForMentionInQuery: () => { },
  showInvalidMentionPopup: false,
  onClickTranslateComment: content => { },
  onClickRestoreComment: content => { }
}
