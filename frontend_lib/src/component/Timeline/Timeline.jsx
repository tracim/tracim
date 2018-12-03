import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Radium from 'radium'
import color from 'color'
import Comment from './Comment.jsx'
import Revision from './Revision.jsx'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'

require('./Timeline.styl')

class Timeline extends React.Component {
  constructor (props) {
    super(props)
    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case 'allApp_changeLang':
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
    document.removeEventListener('appCustomEvent', this.customEventReducer)
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
        {props.showHeader &&
          <div
            className={classnames(`${props.customClass}__header`, 'timeline__header')}
            onClick={props.toggleRightPart}
          >
            <div className='timeline__header__icon mt-3 mb-auto'>
              <i className={classnames('fa fa-fw', {'fa-angle-double-right': props.rightPartOpen, 'fa-angle-double-left': !props.rightPartOpen})} />
            </div>
            <div className='timeline__header__title'>
              {props.t('Timeline')}
            </div>
            <div className='timeline__header__icon mb-3 mt-auto'>
              <i className={classnames('fa fa-fw', {'fa-angle-double-right': props.rightPartOpen, 'fa-angle-double-left': !props.rightPartOpen})} />
            </div>
          </div>
        }

        {props.isArchived &&
          <div className='timeline__info'>
            <div className='timeline__info__msg'>
              <i className='fa fa-fw fa-archive' />
              {props.t('This content is archived.')}
            </div>

            <button className='timeline__info__btnrestore btn' onClick={props.onClickRestoreArchived}>
              <i className='fa fa-fw fa-archive' />
              {props.t('Restore')}
            </button>
          </div>
        }

        {props.isDeleted &&
          <div className='timeline__info'>
            <div className='timeline__info__msg'>
              <i className='fa fa-fw fa-trash' />
              {props.t('This content is deleted.')}
            </div>

            <button className='timeline__info__btnrestore btn' onClick={props.onClickRestoreDeleted}>
              <i className='fa fa-fw fa-trash' />
              {props.t('Restore')}
            </button>
          </div>
        }

        <div className='timeline__body'>
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
                    lang={props.loggedUser.lang}
                    revisionType={content.revision_type}
                    createdFormated={(new Date(content.created_raw)).toLocaleString(props.loggedUser.lang)}
                    createdDistance={content.created}
                    number={content.number}
                    key={`revision_${content.revision_id}`}
                    allowClickOnRevision={props.allowClickOnRevision}
                    onClickRevision={() => props.onClickRevisionBtn(content)}
                  />
              }
            })}
            <li style={{visibility: 'hidden'}} ref={el => { this.timelineBottom = el }} />
          </ul>

          {props.loggedUser.idRoleUserWorkspace >= 2 &&
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
  showHeader: PropTypes.bool,
  rightPartOpen: PropTypes.bool, // irrelevant if showHeader is false
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
    idRoleUserWorkspace: 1
  },
  timelineData: [],
  wysiwyg: false,
  onClickWysiwygBtn: () => {},
  onClickRevisionBtn: () => {},
  allowClickOnRevision: true,
  shouldScrollToBottom: true,
  showHeader: true,
  rightPartOpen: false,
  isArchived: false,
  isDeleted: false
}
