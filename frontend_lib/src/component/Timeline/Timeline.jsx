import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Radium from 'radium'
import color from 'color'
import Comment from './Comment.jsx'
import Revision from './Revision.jsx'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import DisplayState from '../DisplayState/DisplayState.jsx'
import { CUSTOM_EVENT } from '../../customEvent.js'

// require('./Timeline.styl') // see https://github.com/tracim/tracim/issues/1156

class Timeline extends React.Component {
  constructor (props) {
    super(props)
    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<FrontendLib:Timeline> Custom event', 'color: #28a745', type, data)
        i18n.changeLanguage(data)
        break
    }
  }

  componentDidMount () {
    this.scrollToBottom()
  }

  componentDidUpdate () {
    if (window.innerWidth < 1200) return
    this.props.shouldScrollToBottom && this.scrollToBottom()
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  scrollToBottom = () => this.timelineBottom.scrollIntoView({behavior: 'instant'})

  render () {
    const { props } = this

    if (!Array.isArray(props.timelineData)) {
      console.log('Error in Timeline.jsx, props.timelineData is not an array. timelineData: ', props.timelineData)
      return null
    }

    return (
      <div className={classnames('timeline')}>
        <div className='timeline__title'>
          {props.t('Timeline')}
        </div>
        <div className='timeline__body'>
          <div className='timeline__body__warning'>
            {props.isDeprecated && !props.isArchived && !props.isDeleted && (
              <DisplayState
                msg={props.t('This content is deprecated')}
                icon={props.deprecatedStatus.faIcon}
              />
            )}

            {props.isArchived && (
              <DisplayState
                msg={props.t('This content is archived')}
                btnType='button'
                icon='archive'
                btnLabel={props.t('Restore')}
                onClickBtn={props.onClickRestoreArchived}
              />
            )}

            {props.isDeleted && (
              <DisplayState
                msg={props.t('This content is deleted')}
                btnType='button'
                icon='trash'
                btnLabel={props.t('Restore')}
                onClickBtn={props.onClickRestoreDeleted}
              />
            )}
          </div>

          <ul className={classnames(`${props.customClass}__messagelist`, 'timeline__body__messagelist')}>
            {props.timelineData.map(content => {
              switch (content.timelineType) {
                case 'comment':
                  return <Comment
                    customClass={props.customClass}
                    customColor={props.customColor}
                    author={content.author.public_name}
                    createdFormated={(new Date(content.created_raw)).toLocaleString(props.loggedUser.lang)}
                    createdDistance={content.created}
                    text={content.raw_content}
                    fromMe={props.loggedUser.user_id === content.author.user_id}
                    key={`comment_${content.content_id}`}
                  />

                case 'revision':
                  return <Revision
                    customClass={props.customClass}
                    customColor={props.customColor}
                    revisionType={content.revision_type}
                    createdFormated={(new Date(content.created_raw)).toLocaleString(props.loggedUser.lang)}
                    createdDistance={content.created}
                    number={content.number}
                    status={props.availableStatusList.find(status => status.slug === content.status)}
                    authorPublicName={content.author.public_name}
                    allowClickOnRevision={props.allowClickOnRevision}
                    onClickRevision={() => props.onClickRevisionBtn(content)}
                    key={`revision_${content.revision_id}`}
                  />
              }
            })}
            <li style={{visibility: 'hidden'}} ref={el => { this.timelineBottom = el }} />
          </ul>

          {props.loggedUser.userRoleIdInWorkspace >= 2 &&
            <form className={classnames(`${props.customClass}__texteditor`, 'timeline__body__texteditor')}>
              <div className={classnames(`${props.customClass}__texteditor__textinput`, 'timeline__body__texteditor__textinput')}>
                <textarea
                  id='wysiwygTimelineComment'
                  placeholder={props.t('Your message...')}
                  value={props.newComment}
                  onChange={props.onChangeNewComment}
                  disabled={props.disableComment}
                />
              </div>

              <div className={classnames(`${props.customClass}__texteditor__wrapper`, 'timeline__body__texteditor__wrapper')}>
                <div className={classnames(`${props.customClass}__texteditor__advancedtext`, 'timeline__body__texteditor__advancedtext')}>
                  <button
                    type='button'
                    className={classnames(
                      `${props.customClass}__texteditor__advancedtext__btn timeline__body__texteditor__advancedtext__btn btn outlineTextBtn`
                    )}
                    onClick={props.onClickWysiwygBtn}
                    disabled={props.disableComment}
                    style={{
                      borderColor: props.customColor,
                      color: '#252525',
                      ':hover': {
                        backgroundColor: props.customColor,
                        color: '#fdfdfd'
                      }
                    }}
                    key={'timeline__comment__advancedtext'}
                  >
                    {props.wysiwyg ? props.t('Simple text') : props.t('Rich text')}
                  </button>
                </div>

                <div className={classnames(`${props.customClass}__texteditor__submit`, 'timeline__body__texteditor__submit')}>
                  <button
                    type='button'
                    className={classnames(`${props.customClass}__texteditor__submit__btn `, 'timeline__body__texteditor__submit__btn btn highlightBtn')}
                    onClick={props.onClickValidateNewCommentBtn}
                    disabled={props.disableComment || props.newComment === ''}
                    style={{
                      backgroundColor: props.customColor,
                      color: '#fdfdfd',
                      ':hover': {
                        backgroundColor: color(props.customColor).darken(0.15).hexString()
                      }
                    }}
                    key={'timeline__comment__send'}
                  >
                    {props.t('Send')}
                    <div
                      className={classnames(`${props.customClass}__texteditor__submit__btn__icon`, 'timeline__body__texteditor__submit__btn__icon')}>
                      <i className='fa fa-paper-plane-o' />
                    </div>
                  </button>
                </div>
              </div>
            </form>
          }
        </div>
      </div>
    )
  }
}

export default translate()(Radium(Timeline))

Timeline.propTypes = {
  timelineData: PropTypes.array.isRequired,
  newComment: PropTypes.string.isRequired,
  onChangeNewComment: PropTypes.func.isRequired,
  onClickValidateNewCommentBtn: PropTypes.func.isRequired,
  disableComment: PropTypes.bool,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  loggedUser: PropTypes.object,
  wysiwyg: PropTypes.bool,
  onClickWysiwygBtn: PropTypes.func,
  onClickRevisionBtn: PropTypes.func,
  allowClickOnRevision: PropTypes.bool,
  shouldScrollToBottom: PropTypes.bool,
  rightPartOpen: PropTypes.bool,
  isArchived: PropTypes.bool,
  onClickRestoreArchived: PropTypes.func,
  isDeleted: PropTypes.bool,
  onClickRestoreDeleted: PropTypes.func
  // toggleRightPart: PropsTypes.func // this props comes from PopinFixedContent
}

Timeline.defaultProps = {
  disableComment: false,
  customClass: '',
  customColor: '',
  loggedUser: {
    id: '',
    name: '',
    userRoleIdInWorkspace: 1
  },
  timelineData: [],
  wysiwyg: false,
  onClickWysiwygBtn: () => {},
  onClickRevisionBtn: () => {},
  allowClickOnRevision: true,
  shouldScrollToBottom: true,
  rightPartOpen: false,
  isArchived: false,
  isDeleted: false
}
