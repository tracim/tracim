import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Avatar, { AVATAR_SIZE } from '../Avatar/Avatar.jsx'
import HTMLContent from '../HTMLContent/HTMLContent.jsx'
import PropTypes from 'prop-types'
import { TRANSLATION_STATE } from '../../translation.js'
import TranslateButton from '../Button/TranslateButton.jsx'
import EmojiReactions from '../../container/EmojiReactions.jsx'
import DropdownMenu from '../DropdownMenu/DropdownMenu.jsx'
import IconButton from '../Button/IconButton.jsx'
import LinkPreview from '../LinkPreview/LinkPreview.jsx'
import ProfileNavigation from '../../component/ProfileNavigation/ProfileNavigation.jsx'
import {
  ROLE,
  CONTENT_TYPE,
  formatAbsoluteDate,
  displayDistanceDate,
  addExternalLinksIcons
} from '../../helper.js'

import CommentFilePreview from './CommentFilePreview.jsx'

function areCommentActionsAllowed (loggedUser, commentAuthorId) {
  return (
    loggedUser.userRoleIdInWorkspace >= ROLE.workspaceManager.id ||
    loggedUser.userId === commentAuthorId
  )
}

const Comment = props => {
  const styleSent = {
    borderColor: props.customColor
  }

  const createdFormated = formatAbsoluteDate(props.created, props.loggedUser.lang)
  const createdDistance = displayDistanceDate(props.created, props.loggedUser.lang)
  const isFile = (props.apiContent.content_type || props.apiContent.type) === CONTENT_TYPE.FILE
  const actionsAllowed = areCommentActionsAllowed(props.loggedUser, props.author.user_id)

  return (
    <div className={classnames(`${props.customClass}__messagelist__item`, 'timeline__messagelist__item')}>
      <div
        className={classnames(`${props.customClass}`, 'comment', {
          sent: props.fromMe,
          received: !props.fromMe
        })}
        style={props.fromMe ? styleSent : {}}
      >
        <div className={classnames(`${props.customClass}__body`, 'comment__body')}>
          {!props.isPublication && (
            <Avatar
              size={AVATAR_SIZE.MEDIUM}
              user={props.author}
              apiUrl={props.apiUrl}
            />
          )}
          <div className={classnames(`${props.customClass}__body__content`, 'comment__body__content')}>
            {!props.isPublication && (
              <div className={classnames(`${props.customClass}__body__content__header`, 'comment__body__content__header')}>
                <div className={classnames(`${props.customClass}__body__content__header__meta`, 'comment__body__content__header__meta')}>
                  <ProfileNavigation
                    user={{
                      userId: props.author.user_id,
                      publicName: props.author.public_name
                    }}
                  >
                    <span className={classnames(`${props.customClass}__body__content__header__meta__author`, 'comment__body__content__header__meta__author')}>
                      {props.author.public_name}
                    </span>
                  </ProfileNavigation>

                  <div
                    className={classnames(`${props.customClass}__body__content__header__meta__date`, 'comment__body__content__header__meta__date')}
                    title={createdFormated}
                  >
                    {createdDistance}
                  </div>
                </div>

                {(isFile || actionsAllowed) && (
                  <DropdownMenu
                    buttonCustomClass='comment__body__content__header__actions'
                    buttonIcon='fas fa-ellipsis-v'
                    buttonTooltip={props.t('Actions')}
                  >
                    {(isFile
                      ? (
                        <IconButton
                          icon='fas fa-paperclip'
                          intent='link'
                          key='openFileComment'
                          mode='dark'
                          onClick={props.onClickOpenFileComment}
                          text={props.t('Open as content')}
                        />
                      )
                      : (
                        <IconButton
                          icon='fas fa-fw fa-pencil-alt'
                          intent='link'
                          key='editComment'
                          mode='dark'
                          onClick={props.onClickEditComment}
                          text={props.t('Edit')}
                          title={props.t('Edit comment')}
                        />
                      )
                    )}

                    {(actionsAllowed &&
                      <IconButton
                        icon='far fa-fw fa-trash-alt'
                        intent='link'
                        key='deleteComment'
                        mode='dark'
                        onClick={props.onClickDeleteComment}
                        text={props.t('Delete')}
                        title={props.t('Delete comment')}
                      />
                    )}
                  </DropdownMenu>
                )}
              </div>
            )}

            <div className='comment__body__content__textAndPreview'>
              <div className='comment__body__content__text'>
                <div
                  className={classnames(`${props.customClass}__body__content__text`, 'comment__body__content__text')}
                >
                  {(isFile
                    ? (
                      <CommentFilePreview
                        apiUrl={props.apiUrl}
                        apiContent={props.apiContent}
                        isPublication={props.isPublication}
                      />
                    )
                    : (
                      <HTMLContent isTranslated={props.translationState === TRANSLATION_STATE.TRANSLATED}>
                        {addExternalLinksIcons(props.text)}
                      </HTMLContent>
                    )
                  )}
                </div>
              </div>
              <LinkPreview apiUrl={props.apiUrl} findLinkInHTML={props.text} />
            </div>
          </div>
        </div>
        <div
          className={classnames(`${props.customClass}__footer`, 'comment__footer')}
        >
          {!isFile && (
            <TranslateButton
              translationState={props.translationState}
              onClickTranslate={props.onClickTranslate}
              onClickRestore={props.onClickRestore}
              onChangeTargetLanguageCode={props.onChangeTranslationTargetLanguageCode}
              targetLanguageCode={props.translationTargetLanguageCode}
              targetLanguageList={props.translationTargetLanguageList}
              dataCy='commentTranslateButton'
            />
          )}
          <EmojiReactions
            apiUrl={props.apiUrl}
            loggedUser={props.loggedUser}
            contentId={props.contentId}
            workspaceId={props.workspaceId}
          />

          {props.isPublication && (
            <IconButton
              key={1}
              text={'Show comments'}
              onClick={props.toggleCommentList}
              intent='link'
              mode='light'
              // dataCy={props.dataCy ? `${props.dataCy}__language__${language.code}` : null}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default translate()(Comment)

Comment.propTypes = {
  author: PropTypes.object.isRequired,
  isPublication: PropTypes.bool.isRequired,
  loggedUser: PropTypes.object.isRequired,
  contentId: PropTypes.number.isRequired,
  apiContent: PropTypes.object.isRequired,
  workspaceId: PropTypes.number.isRequired,
  customClass: PropTypes.string,
  text: PropTypes.string,
  created: PropTypes.string.isRequired,
  fromMe: PropTypes.bool,
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE)),
  onClickEditComment: PropTypes.func,
  onClickDeleteComment: PropTypes.func,
  onClickOpenFileComment: PropTypes.func,
  onClickTranslate: PropTypes.func.isRequired,
  onClickRestore: PropTypes.func.isRequired,
  onChangeTranslationTargetLanguageCode: PropTypes.func.isRequired,
  translationTargetLanguageCode: PropTypes.string.isRequired,
  translationTargetLanguageList: PropTypes.arrayOf(PropTypes.object).isRequired,
  toggleCommentList: PropTypes.func
}

Comment.defaultProps = {
  customClass: '',
  text: '',
  fromMe: false,
  translationState: TRANSLATION_STATE.DISABLED,
  onClickEditComment: () => {},
  onClickOpenFileComment: () => {},
  onClickDeleteComment: () => {}
}
