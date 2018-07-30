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
        <div className='mr-5'>
          {props.createdAt}
        </div>
        {props.author}
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
