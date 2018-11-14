import React from 'react'
import classnames from 'classnames'

require('./Comment.styl')

const Comment = props => {
  const styleSent = {
    color: '#fdfdfd',
    backgroundColor: props.customColor
  }

  const styleReceived = {
    color: '#333',
    backgroundColor: '#fdfdfd',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: props.customColor
  }

  return (
    <li className={classnames(`${props.customClass}__messagelist__item`, 'timeline__body__messagelist__item')}>
      <div className={classnames(`${props.customClass}`, 'comment', {
        'sent': props.fromMe,
        'received': !props.fromMe
      })}>
        <div className={classnames(`${props.customClass}__header`, 'comment__header')}>
          <div className={classnames(`${props.customClass}__header__text`, 'comment__header__text')}>
            <div className={classnames(`${props.customClass}__header__text__author`, 'comment__header__text__author')}>
              {props.author}
            </div>

            <div
              className={classnames(`${props.customClass}__header__text__date`, 'comment__header__text__date')}
              title={props.createdFormated}
            >
              {props.createdDistance}
            </div>
          </div>

          <div className={classnames(`${props.customClass}__header__avatar`, 'comment__header__avatar')}>
            <img src={props.avatar} />
          </div>
        </div>

        <div
          className={classnames(`${props.customClass}__body`, 'comment__body')}
          style={props.fromMe ? styleSent : styleReceived}
          dangerouslySetInnerHTML={{__html: props.text}}
        />
      </div>
    </li>
  )
}

export default Comment
