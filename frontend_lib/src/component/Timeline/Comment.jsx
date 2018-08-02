import React from 'react'
import classnames from 'classnames'

const Comment = props => {
  const styleSent = {
    color: '#fdfdfd',
    backgroundColor: props.customColor
  }

  const styleReceived = {
    color: '#333',
    backgroundColor: '#fdfdfd'
  }

  return (
    <li className={classnames(
      `${props.customClass}__messagelist__item`,
      'timeline__body__messagelist__item', {
        'sent': props.fromMe,
        'received': !props.fromMe
      }
    )}>
      <div className={classnames(`${props.customClass}__messagelist__item__wrapper`, 'timeline__body__messagelist__item__wrapper')}>
        <div className={classnames(`${props.customClass}__messagelist__item__avatar`, 'timeline__body__messagelist__item__avatar')}>
          {props.avatar ? <img src={props.avatar} /> : ''}
        </div>
      </div>
      <div className={classnames(`${props.customClass}__messagelist__item__authorandhour`, 'timeline__body__messagelist__item__authorandhour')}>
        <div className={classnames(`${props.customClass}__messagelist__item__authorandhour__author`, 'timeline__body__messagelist__item__authorandhour__author')}>
          {props.author}
        </div>
        <div className={classnames(`${props.customClass}__messagelist__item__authorandhour__date`, 'timeline__body__messagelist__item__authorandhour__date')}>
          {props.createdAt}
        </div>
      </div>
      <div
        className={classnames(`${props.customClass}__messagelist__item__content`, 'timeline__body__messagelist__item__content')}
        style={props.fromMe ? styleSent : styleReceived}
        dangerouslySetInnerHTML={{__html: props.text}}
      />
    </li>
  )
}

export default Comment
