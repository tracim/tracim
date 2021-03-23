import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Avatar, { AVATAR_SIZE } from '../Avatar/Avatar.jsx'
import {
  buildFilePreviewUrl,
  formatAbsoluteDate,
  removeExtensionOfFilename
} from '../../helper.js'
import EmojiReactions from '../../container/EmojiReactions.jsx'

export const CommentFilePreview = props => {
  const styleSent = {
    borderColor: props.customColor
  }
  const apiAuthor = props.apiContent.author
  const createdFormatted = formatAbsoluteDate(props.apiContent.created_raw, props.loggedUser.lang)
  const fromMe = props.loggedUser.userId === apiAuthor.user_id

  const previewUrl = buildFilePreviewUrl(
    props.apiUrl,
    props.apiContent.workspace_id,
    props.apiContent.content_id,
    props.apiContent.revision_id,
    removeExtensionOfFilename(props.apiContent.filename),
    1, // page
    380, // width
    380 // height
  )

  return (
    <li className={classnames(`${props.customClass}__messagelist__item`, 'timeline__messagelist__item')}>
      <div
        className={classnames(`${props.customClass}`, 'comment', {
          sent: fromMe,
          received: !fromMe
        })}
        style={fromMe ? styleSent : {}}
      >
        <div
          className={classnames(`${props.customClass}__body`, 'comment__body')}
        >
          <div className='comment__body__content'>
            <Avatar
              size={AVATAR_SIZE.MEDIUM}
              user={apiAuthor}
              apiUrl={props.apiUrl}
            />
            <div className='comment__body__content__text'>
              <div className={classnames(`${props.customClass}__body__author`, 'comment__body__author')}>
                {apiAuthor.public_name}
              </div>

              <div
                className={classnames(`${props.customClass}__body__date`, 'comment__body__date')}
                title={createdFormatted}
              >
                {props.apiContent.created}
              </div>

              <div
                className={classnames(`${props.customClass}__body__text`, 'comment__body__text')}
              >
                <img
                  className={classnames(`${props.customClass}__body__text__asFile`, 'comment__body__text__asFile')}
                  src={previewUrl}
                  alt={props.apiContent.filename}
                />
              </div>
            </div>
          </div>

          <div className={classnames(`${props.customClass}__footer`, 'comment__footer')}>
            <EmojiReactions
              apiUrl={props.apiUrl}
              loggedUserId={props.loggedUser.userId}
              contentId={props.apiContent.content_id}
              workspaceId={props.apiContent.workspace_id}
            />
          </div>
        </div>
      </div>
    </li>
  )
}

export default CommentFilePreview

CommentFilePreview.propTypes = {
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  apiUrl: PropTypes.string,
  apiContent: PropTypes.object,
  loggedUser: PropTypes.object
}

CommentFilePreview.defaultProps = {
  customClass: '',
  customColor: '',
  apiUrl: '',
  apiContent: {
    author: {
      user_id: '',
      public_name: ''
    },
    created_raw: '',
    workspace_id: '',
    content_id: '',
    revision_id: '',
    filename: '',
    created: ''
  },
  loggedUser: {
    lang: '',
    userId: ''
  }
}
