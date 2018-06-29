import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./Timeline.styl')

const Comment = props => (
  <li
    className={classnames(
      `${props.customClass}__messagelist__item`,
      'timeline__messagelist__item', {
        'sended': props.fromMe,
        'received': !props.fromMe
      }
    )}
  >
    <div className={classnames(`${props.customClass}__messagelist__item__avatar`, 'timeline__messagelist__item__avatar')}>
      {props.avatar ? <img src={props.avatar} /> : ''}
    </div>
    <div
      className={classnames(`${props.customClass}__messagelist__item__createhour`, 'timeline__messagelist__item__createhour')}>
      {props.createdAt}
    </div>
    <div
      className={classnames(`${props.customClass}__messagelist__item__content`, 'timeline__messagelist__item__content')}>
      {props.text}
    </div>
  </li>
)

const Revision = props => (
  <li className={classnames(`${props.customClass}__messagelist__version`, 'timeline__messagelist__version')} >
    <div className={classnames(`${props.customClass}__messagelist__version__btn`, 'timeline__messagelist__version__btn btn')}>
      <i className='fa fa-code-fork' />
      version {props.number}
    </div>
    <div className={classnames(`${props.customClass}__messagelist__version__date`, 'timeline__messagelist__version__date')}>
      Créer le {props.createdAt}
    </div>
  </li>
)

const Timeline = props => {
  if (!Array.isArray(props.timelineData)) {
    console.log('Error in Timeline.jsx, props.timelineData is not an array. timelineData: ', props.timelineData)
    return null
  }

  return (
    <div className='timeline'>
      <div className={classnames(`${props.customClass}__header`, 'timeline__header')}>
        Timeline
      </div>

      <ul className={classnames(`${props.customClass}__messagelist`, 'timeline__messagelist')}>
        { props.timelineData.map(content => {
          switch (content.timelineType) {
            case 'comment':
              return <Comment
                customClass={props.customClass}
                avatar={content.author.avatar_url}
                createdAt={content.created}
                text={content.raw_content}
                fromMe={props.loggedUser.user_id === content.author.user_id}
                key={`comment_${content.content_id}`}
              />

            case 'revision':
              return <Revision
                customClass={props.customClass}
                createdAt={content.created}
                number={props.timelineData.filter(c => c.timelineType === 'revision' && c.revision_id <= content.revision_id).length}
                key={`revision_${content.revision_id}`}
              />
          }
        })}
      </ul>

      <form className={classnames(`${props.customClass}__texteditor`, 'timeline__texteditor d-flex align-items-center justify-content-between flex-wrap')}>

        <div className={classnames(`${props.customClass}__texteditor__textinput`, 'timeline__texteditor__textinput')}>
          <textarea
            placeholder='Taper votre message ici'
            value={props.newComment}
            onChange={props.onChangeNewComment}
          />
        </div>

        <div className={classnames(`${props.customClass}__texteditor__wrapper`, 'timeline__texteditor__wrapper')}>

          <div className={classnames(`${props.customClass}__texteditor__advancedtext`, 'timeline__texteditor__advancedtext')}>
            <button type='button' className={classnames(`${props.customClass}__texteditor__advancedtext__btn`, 'timeline__texteditor__advancedtext__btn btn btn-outline-primary')}>
              Texte Avancé
            </button>
          </div>

          <div className={classnames(`${props.customClass}__texteditor__submit`, 'timeline__texteditor__submit mb-2')}>
            <button
              type='button'
              className={classnames(`${props.customClass}__texteditor__submit__btn`, 'timeline__texteditor__submit__btn btn')}
              onClick={props.onClickValidateNewCommentBtn}
            >
              Envoyer
              <div className={classnames(`${props.customClass}__texteditor__submit__btn__icon`, 'timeline__texteditor__submit__btn__icon')}>
                <i className='fa fa-paper-plane-o' />
              </div>
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}

export default Timeline

Timeline.propTypes = {
  timelineData: PropTypes.array.isRequired,
  newComment: PropTypes.string.isRequired,
  onChangeNewComment: PropTypes.func.isRequired,
  onClickValidateNewCommentBtn: PropTypes.func.isRequired,
  customClass: PropTypes.string,
  loggedUser: PropTypes.object
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
