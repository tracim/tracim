import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Comment from './Comment.jsx'
import Revision from './Revision.jsx'

require('./Timeline.styl')

class Timeline extends React.Component {
  componentDidMount () {
    this.scrollToBottom()
  }

  componentDidUpdate () {
    this.scrollToBottom()
  }

  scrollToBottom = () => this.timelineBottom.scrollIntoView({behavior: 'instant'})

  render () {
    const { props } = this

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
          {props.timelineData.map(content => {
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
          <li style={{visibility: 'hidden'}} ref={el => { this.timelineBottom = el }} />
        </ul>

        <form className={classnames(`${props.customClass}__texteditor`, 'timeline__texteditor d-flex align-items-center justify-content-between flex-wrap')}>
          <div className={classnames(`${props.customClass}__texteditor__textinput`, 'timeline__texteditor__textinput')}>
            <textarea
              id='wysiwygTimelineComment'
              placeholder='Taper votre message ici'
              value={props.newComment}
              onChange={props.onChangeNewComment}
            />
          </div>

          <div className={classnames(`${props.customClass}__texteditor__wrapper`, 'timeline__texteditor__wrapper')}>
            <div className={classnames(`${props.customClass}__texteditor__advancedtext`, 'timeline__texteditor__advancedtext')}>
              <button
                type='button'
                className={classnames(
                  `${props.customClass}__texteditor__advancedtext__btn timeline__texteditor__advancedtext__btn btn btn-outline-primary`
                )}
                onClick={props.onClickWysiwygBtn}
              >
                {props.wysiwyg ? 'Text Simple' : 'Texte Avancé'}
              </button>
            </div>

            <div className={classnames(`${props.customClass}__texteditor__submit`, 'timeline__texteditor__submit mb-2')}>
              <button
                type='button'
                className={classnames(`${props.customClass}__texteditor__submit__btn`, 'timeline__texteditor__submit__btn btn')}
                onClick={props.onClickValidateNewCommentBtn}
              >
                Envoyer
                <div
                  className={classnames(`${props.customClass}__texteditor__submit__btn__icon`, 'timeline__texteditor__submit__btn__icon')}>
                  <i className='fa fa-paper-plane-o' />
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

export default Timeline

Timeline.propTypes = {
  timelineData: PropTypes.array.isRequired,
  newComment: PropTypes.string.isRequired,
  onChangeNewComment: PropTypes.func.isRequired,
  onClickValidateNewCommentBtn: PropTypes.func.isRequired,
  customClass: PropTypes.string,
  loggedUser: PropTypes.object,
  wysiwyg: PropTypes.bool,
  onClickWysiwygBtn: PropTypes.func
}

Timeline.defaultProps = {
  customClass: '',
  loggedUser: {
    id: '',
    name: '',
    avatar: ''
  },
  timelineData: [],
  wysiwyg: false,
  onClickWysiwygBtn: () => {}
}
