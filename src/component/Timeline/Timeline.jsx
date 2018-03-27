import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./Timeline.styl')

const Message = props => (
  <li className={classnames(
    `${props.customClass}__messagelist__item`,
    'timeline__messagelist__item',
    {
      'sended': props.fromMe,
      'received': !props.fromMe
    }
  )}>
    <div className={classnames(`${props.customClass}__messagelist__item__avatar`, 'timeline__messagelist__item__avatar')}>
      <img src={props.avatar} alt='avatar' />
    </div>
    <div
      className={classnames(`${props.customClass}__messagelist__item__createhour`, 'timeline__messagelist__item__createhour')}>
      {props.createdAt.day} à {props.createdAt.hour}
    </div>
    <div
      className={classnames(`${props.customClass}__messagelist__item__content`, 'timeline__messagelist__item__content')}>
      {props.text}
    </div>
  </li>
)

const Version = props => (
  <li className={classnames(`${props.customClass}__messagelist__version`, 'timeline__messagelist__version')}>
    <div className={classnames(`${props.customClass}__messagelist__version__btn`, 'timeline__messagelist__version__btn btn')}>
      <i className='fa fa-code-fork' />
      version {props.number}
    </div>
    <div className={classnames(`${props.customClass}__messagelist__version__date`, 'timeline__messagelist__version__date')}>
      Créer le {props.createdAt.day}
    </div>
  </li>
)

const Timeline = props => {
  return (
    <div className='timeline'>
      <div className={classnames(`${props.customClass}__header`, 'timeline__header')}>
        Timeline
      </div>

      <ul className={classnames(`${props.customClass}__messagelist`, 'timeline__messagelist')}>
        { props.timelineData.map(content => {
          switch (content.type) {
            case 'message':
              return <Message
                customClass={props.customClass}
                avatar={content.author.avatar}
                createdAt={content.createdAt}
                text={content.text}
                fromMe={props.loggedUser.id === content.author.id}
                key={content.id}
              />

            case 'version':
              return <Version
                customClass={props.customClass}
                createdAt={content.createdAt}
                number={content.number}
                key={content.id}
              />
          }
        })}
      </ul>

      <form className={classnames(`${props.customClass}__texteditor`, 'timeline__texteditor')}>
        <div
          className={classnames(`${props.customClass}__texteditor__simpletext`, 'timeline__texteditor__simpletext input-group d-inline-flex d-sm-inline-flex d-md-inline-flex d-lg-none')}>
          <input
            type='text'
            className={classnames(`${props.customClass}__texteditor__simpletext__input`, 'timeline__texteditor__simpletext__input form-control')}
            placeholder='...'
          />
          <div
            className={classnames(`${props.customClass}__texteditor__simpletext__icon`, 'timeline__texteditor__simpletext__icon input-group-addon')}>
            <i className='fa fa-font' />
          </div>
        </div>
        <div className={classnames(`${props.customClass}__texteditor__wysiwyg`, 'timeline__texteditor__wysiwyg d-none d-lg-block')}>
          <textarea />
        </div>
        <div className={classnames(`${props.customClass}__texteditor__submit`, 'timeline__texteditor__submit d-inline-flex d-lg-flex justify-content-lg-center')}>
          <button
            type='submit'
            className={classnames(`${props.customClass}__texteditor__submit__btn`, 'timeline__texteditor__submit__btn btn')}
          >
            Envoyer
            <div className={classnames(`${props.customClass}__texteditor__submit__btn__icon`, 'timeline__texteditor__submit__btn__icon')}>
              <i className='fa fa-paper-plane-o' />
            </div>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Timeline

Timeline.propTypes = {
  customClass: PropTypes.string,
  loggedUser: PropTypes.object,
  timelineData: PropTypes.array
}

Timeline.defaultProps = {
  customClass: '',
  loggedUser: {
    id: '',
    name: '',
    avatar: ''
  },
  timelineData: []
}
