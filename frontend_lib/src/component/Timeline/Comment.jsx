import React from 'react'
import classnames from 'classnames'
import Avatar, { AVATAR_SIZE } from '../Avatar/Avatar.jsx'
import HTMLContent from '../HTMLContent/HTMLContent.jsx'
import PropTypes from 'prop-types'

const Comment = props => {
  const styleSent = {
    borderColor: props.customColor
  }

  return (
    <li className={classnames(`${props.customClass}__messagelist__item`, 'timeline__messagelist__item')}>
      <div className={classnames(`${props.customClass}`, 'comment', {
        sent: props.fromMe,
        received: !props.fromMe
      })}
      >
        <div
          className={classnames(`${props.customClass}__body`, 'comment__body')}
          style={props.fromMe ? styleSent : {}}
        >
          <Avatar
            size={AVATAR_SIZE.MEDIUM}
            user={props.author}
            apiUrl={props.apiUrl}
          />

          <div className='comment__body__content'>
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
              <HTMLContent>{props.text}</HTMLContent>
            </div>
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
  fromMe: PropTypes.bool
}

Comment.defaultProps = {
  customClass: '',
  author: '',
  text: '',
  createdFormated: '',
  createdDistance: '',
  fromMe: false
}
