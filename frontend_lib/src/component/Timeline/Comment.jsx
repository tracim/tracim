import React from 'react'
import classnames from 'classnames'
import Avatar, { AVATAR_SIZE } from '../Avatar/Avatar.jsx'
import HTMLContent from '../HTMLContent/HTMLContent.jsx'
import PropTypes from 'prop-types'

import { TRANSLATION_STATE } from '../../translation.js'
import TranslateButton from '../Button/TranslateButton.jsx'

const Comment = props => {
  const styleSent = {
    borderColor: props.customColor
  }

  return (
    <li className={classnames(`${props.customClass}__messagelist__item`, 'timeline__messagelist__item')}>
      <div
        className={classnames(`${props.customClass}`, 'comment', {
          sent: props.fromMe,
          received: !props.fromMe
        })}
        style={props.fromMe ? styleSent : {}}
      >
        <div
          className={classnames(`${props.customClass}__body`, 'comment__body')}
        >
          <div className='comment__body__content'>
            <Avatar
              size={AVATAR_SIZE.MEDIUM}
              user={props.author}
              apiUrl={props.apiUrl}
            />
            <div className='comment__body__content__text'>
              <div className={classnames(`${props.customClass}__body__author`, 'comment__body__author')}>
                {props.author.public_name}
              </div>

              <div
                className={classnames(`${props.customClass}__body__date`, 'comment__body__date')}
                title={props.createdFormated}
              >
                {props.createdDistance}
              </div>

              <div
                className={classnames(`${props.customClass}__body__text`, 'comment__body__text')}
              >
                <HTMLContent isTranslated={props.translationState === TRANSLATION_STATE.TRANSLATED}>{props.text}</HTMLContent>
              </div>
            </div>
          </div>
          <div
            className={classnames(`${props.customClass}__footer`, 'comment__footer')}
          >
            <TranslateButton
              translationState={props.translationState}
              onClickTranslate={props.onClickTranslate}
              onClickRestore={props.onClickRestore}
              dataCy='commentTranslateButton'
            />
          </div>
        </div>
      </div>
    </li>
  )
}

export default Comment

Comment.propTypes = {
  customClass: PropTypes.string,
  author: PropTypes.object,
  text: PropTypes.string,
  createdFormated: PropTypes.string,
  createdDistance: PropTypes.string,
  fromMe: PropTypes.bool,
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE)),
  onClickTranslate: PropTypes.func,
  onClickRestore: PropTypes.func
}

Comment.defaultProps = {
  customClass: '',
  author: '',
  text: '',
  createdFormated: '',
  createdDistance: '',
  fromMe: false,
  translationState: TRANSLATION_STATE.DISABLED
}
