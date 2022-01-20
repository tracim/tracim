import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import { TracimComponent } from '../../tracimComponent.js'
import { appContentFactory } from '../../appContentFactory.js'
import { CUSTOM_EVENT } from '../../customEvent.js'
import { CONTENT_TYPE } from '../../helper.js'
import CardPopup from '../CardPopup/CardPopup.jsx'
import IconButton from '../Button/IconButton.jsx'
import CommentArea from './CommentArea.jsx'

// require('./EditCommentPopup.styl') // see https://github.com/tracim/tracim/issues/1156

const wysiwygId = 'wysiwygTimelineCommentEdit'
const wysiwygIdSelector = `#${wysiwygId}`

export class EditCommentPopup extends React.Component {
  constructor (props) {
    super(props)
    props.setApiUrl(props.apiUrl)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    this.state = {
      newComment: props.comment || ''
    }
  }

  componentWillUnmount () {
    globalThis.tinymce.remove(wysiwygIdSelector)
  }

  handleAllAppChangeLanguage = (data) => {
    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, true)
  }

  searchForMentionOrLinkInQuery = async (query) => {
    return await this.props.searchForMentionOrLinkInQuery(query, this.props.workspaceId)
  }

  render () {
    const { props, state } = this

    return (
      <CardPopup
        customClass='editCommentPopup'
        customColor={props.customColor}
        onClose={props.onClickClose}
        label={props.t('Edit comment')}
        faIcon='fas fa-edit'
      >
        <CommentArea
          apiUrl={props.apiUrl}
          contentId={props.commentId}
          contentType={CONTENT_TYPE.COMMENT}
          hideSendButtonAndOptions
          id={wysiwygId}
          lang={props.loggedUserLanguage}
          newComment={state.newComment}
          searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
          workspaceId={props.workspaceId}
          wysiwyg
          wysiwygIdSelector={wysiwygIdSelector}
        />

        <div className='editCommentPopup__buttons'>
          <IconButton
            color={props.customColor}
            icon='fas fa-times'
            intent='secondary'
            mode='dark'
            onClick={props.onClickClose}
            text={props.t('Cancel')}
            type='button'
          />
          <IconButton
            color={props.customColor}
            disabled={state.newComment === ''}
            icon='far fa-paper-plane'
            intent='primary'
            mode='light'
            onClick={() => props.onClickValidate(state.newComment)}
            text={props.t('Send')}
            type='button'
          />
        </div>
      </CardPopup>
    )
  }
}
export default translate()(appContentFactory(TracimComponent(EditCommentPopup)))

EditCommentPopup.propTypes = {
  comment: PropTypes.string.isRequired,
  onClickClose: PropTypes.func.isRequired,
  onClickValidate: PropTypes.func.isRequired,
  apiUrl: PropTypes.string,
  customColor: PropTypes.string,
  loggedUserLanguage: PropTypes.string,
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  commentId: PropTypes.number
}

EditCommentPopup.defaultProps = {
  apiUrl: '',
  customColor: undefined,
  loggedUserLanguage: 'en',
  workspaceId: undefined,
  commentId: 0
}
