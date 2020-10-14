import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Radium from 'radium'
import Comment from './Comment.jsx'
import Revision from './Revision.jsx'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import { ROLE, CONTENT_TYPE, TIMELINE_TYPE, formatAbsoluteDate } from '../../helper.js'
import PromptMessage from '../PromptMessage/PromptMessage.jsx'
import { CUSTOM_EVENT } from '../../customEvent.js'
import { TracimComponent } from '../../tracimComponent.js'
import CommentTextArea from './CommentTextArea.jsx'

// require('./Timeline.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

export class Timeline extends React.Component {
  constructor (props) {
    super(props)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    this.timelineContainerScrollHeight = 0
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<FrontendLib:Timeline> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    i18n.changeLanguage(data)
  }

  componentDidMount () {
    this.timelineContainerScrollHeight = this.timelineContainer.scrollHeight
    if (window.innerWidth < 1200) return
    this.timelineBottom.scrollIntoView({ behavior: 'instant' })
  }

  componentDidUpdate (prevProps) {
    if (this.props.shouldScrollToBottom && this.props.timelineData && prevProps.timelineData) {
      this.scrollToBottom(prevProps.timelineData)
    }
    this.timelineContainerScrollHeight = this.timelineContainer.scrollHeight
  }

  scrollToBottom = (prevTimeline) => {
    const { props } = this

    if (props.timelineData.length === 0) return

    const lastCurrentTimelineItem = props.timelineData[props.timelineData.length - 1]
    const isNewContent = prevTimeline.length > 0
      ? this.getTimelineContentId(prevTimeline[prevTimeline.length - 1]) !== this.getTimelineContentId(lastCurrentTimelineItem)
      : false

    const scrollPosition = this.timelineContainer.scrollTop + this.timelineContainer.clientHeight
    const isScrollAtTheBottom = scrollPosition === this.timelineContainerScrollHeight

    const isLastTimelineItemAddedFromCurrentToken = props.isLastTimelineItemCurrentToken && props.newComment === ''
    const isLastTimelineItemTypeComment = props.timelineData[props.timelineData.length - 1].content_type === CONTENT_TYPE.COMMENT

    // GM - INFO - 2020-06-30 - When width >= 1200: Check if the timeline scroll is at the bottom
    // or if the new item was created by the current session tokenId or if the content_id has changed.
    // When width >= 1200: Check the if the new comment was created by the current session tokenId.
    if (
      (window.innerWidth >= 1200 && (isNewContent || isScrollAtTheBottom || isLastTimelineItemAddedFromCurrentToken)) ||
      (window.innerWidth < 1200 && isLastTimelineItemAddedFromCurrentToken && isLastTimelineItemTypeComment)
    ) {
      const behavior = isScrollAtTheBottom && props.isLastTimelineItemCurrentToken ? 'smooth' : 'instant'
      this.timelineBottom.scrollIntoView({ behavior })
    }
  }

  getTimelineContentId = (content) => {
    if (!content) return -1
    return content.timelineType === TIMELINE_TYPE.COMMENT ? content.parent_id : content.content_id
  }

  render () {
    const { props } = this

    if (!Array.isArray(props.timelineData)) {
      console.log('Error in Timeline.jsx, props.timelineData is not an array. timelineData: ', props.timelineData)
      return null
    }

    return (
      <div className={classnames('timeline')}>
        {props.showTitle &&
          <div className='timeline__title'>
            {props.t('Timeline')}
          </div>}
        <div className='timeline__warning'>
          {props.isDeprecated && !props.isArchived && !props.isDeleted && (
            <PromptMessage
              msg={props.t('This content is deprecated')}
              icon={props.deprecatedStatus.faIcon}
            />
          )}

          {props.isArchived && (
            <PromptMessage
              msg={props.t('This content is archived')}
              btnType='button'
              icon='archive'
              btnLabel={props.t('Restore')}
              onClickBtn={props.onClickRestoreArchived}
            />
          )}

          {props.isDeleted && (
            <PromptMessage
              msg={props.t('This content is deleted')}
              btnType='button'
              icon='trash'
              btnLabel={props.t('Restore')}
              onClickBtn={props.onClickRestoreDeleted}
            />
          )}
        </div>

        <ul className={classnames(`${props.customClass}__messagelist`, 'timeline__messagelist')} ref={el => { this.timelineContainer = el }}>
          {props.timelineData.map(content => {
            switch (content.timelineType) {
              case 'comment':
                return (
                  <Comment
                    customClass={props.customClass}
                    customColor={props.customColor}
                    author={content.author.public_name}
                    createdFormated={formatAbsoluteDate(content.created_raw, props.loggedUser.lang)}
                    createdDistance={content.created}
                    text={content.raw_content}
                    fromMe={props.loggedUser.userId === content.author.user_id}
                    key={`comment_${content.content_id}`}
                  />
                )
              case 'revision':
                return (
                  <Revision
                    customClass={props.customClass}
                    customColor={props.customColor}
                    revisionType={content.revision_type}
                    createdFormated={formatAbsoluteDate(content.created_raw, props.loggedUser.lang)}
                    createdDistance={content.created}
                    number={content.number}
                    status={props.availableStatusList.find(status => status.slug === content.status)}
                    authorPublicName={content.author.public_name}
                    allowClickOnRevision={props.allowClickOnRevision}
                    onClickRevision={() => props.onClickRevisionBtn(content)}
                    key={`revision_${content.revision_id}`}
                  />
                )
            }
          })}
          <li style={{ visibility: 'hidden' }} ref={el => { this.timelineBottom = el }} />
        </ul>

        {props.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
          <form className={classnames(`${props.customClass}__texteditor`, 'timeline__texteditor')}>
            <div
              className={classnames(
                `${props.customClass}__texteditor__textinput`,
                'timeline__texteditor__textinput'
              )}
            >
              <CommentTextArea
                id='wysiwygTimelineComment'
                onChangeNewComment={props.onChangeNewComment}
                newComment={props.newComment}
                disableComment={props.disableComment}
                wysiwyg={props.wysiwyg}
                searchForMentionInQuery={props.searchForMentionInQuery}
                onInitWysiwyg={props.onInitWysiwyg}
              />
            </div>

            <div className={classnames(`${props.customClass}__texteditor__wrapper`, 'timeline__texteditor__wrapper')}>
              <div className={classnames(`${props.customClass}__texteditor__advancedtext`, 'timeline__texteditor__advancedtext')}>
                <button
                  type='button'
                  className={classnames(
                    `${props.customClass}__texteditor__advancedtext__btn timeline__texteditor__advancedtext__btn`
                  )}
                  onClick={props.onClickWysiwygBtn}
                  disabled={props.disableComment}
                  key='timeline__comment__advancedtext'
                >
                  {props.wysiwyg ? props.t('Simple edition') : props.t('Advanced edition')}
                </button>
              </div>

              <div className={classnames(`${props.customClass}__texteditor__submit`, 'timeline__texteditor__submit')}>
                <button
                  type='button'
                  className={classnames(`${props.customClass}__texteditor__submit__btn `, 'timeline__texteditor__submit__btn btn highlightBtn')}
                  onClick={props.onClickValidateNewCommentBtn}
                  disabled={props.disableComment || props.newComment === ''}
                  style={{
                    backgroundColor: props.customColor,
                    color: '#fdfdfd',
                    ':hover': {
                      backgroundColor: color(props.customColor).darken(0.15).hex()
                    }
                  }}
                  key='timeline__comment__send'
                >
                  {props.t('Send')}
                  <div
                    className={classnames(`${props.customClass}__texteditor__submit__btn__icon`, 'timeline__texteditor__submit__btn__icon')}
                  >
                    <i className='fa fa-paper-plane-o' />
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    )
  }
}

export default translate()(Radium(TracimComponent(Timeline)))

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
  isLastTimelineItemCurrentToken: PropTypes.bool,
  rightPartOpen: PropTypes.bool,
  isArchived: PropTypes.bool,
  onClickRestoreArchived: PropTypes.func,
  isDeleted: PropTypes.bool,
  onClickRestoreDeleted: PropTypes.func,
  showTitle: PropTypes.bool,
  searchForMentionInQuery: PropTypes.func
}

Timeline.defaultProps = {
  disableComment: false,
  customClass: '',
  customColor: '',
  loggedUser: {
    userId: '',
    name: '',
    userRoleIdInWorkspace: ROLE.reader.id
  },
  timelineData: [],
  wysiwyg: false,
  onClickWysiwygBtn: () => {},
  onClickRevisionBtn: () => {},
  allowClickOnRevision: true,
  shouldScrollToBottom: true,
  isLastTimelineItemCurrentToken: false,
  rightPartOpen: false,
  isArchived: false,
  isDeleted: false,
  showTitle: true,
  searchForMentionInQuery: () => {}
}
