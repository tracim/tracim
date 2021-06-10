import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import { TracimComponent } from '../../tracimComponent.js'
import { appContentFactory } from '../../appContentFactory.js'
import { CUSTOM_EVENT } from '../../customEvent.js'
import CardPopup from '../CardPopup/CardPopup.jsx'
import IconButton from '../Button/IconButton.jsx'
import CommentTextArea from './CommentTextArea.jsx'

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

  handleInitWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      wysiwygIdSelector,
      this.props.loggedUserLanguage,
      this.handleChangeNewComment,
      handleTinyMceInput,
      handleTinyMceKeyDown,
      handleTinyMceKeyUp,
      handleTinyMceSelectionChange
    )
  }

  handleChangeNewComment = e => this.setState({ newComment: e.target.value })

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
      >
        <span className='editCommentPopup__title'>
          {props.t('Edit comment')}
        </span>

        <CommentTextArea
          apiUrl={props.apiUrl}
          disableAutocompletePosition
          id={wysiwygId}
          newComment={state.newComment}
          onChangeNewComment={this.handleChangeNewComment}
          onInitWysiwyg={this.handleInitWysiwyg}
          searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
          lang={props.loggedUserLanguage}
          wysiwyg
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
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}

EditCommentPopup.defaultProps = {
  apiUrl: '',
  customColor: undefined,
  loggedUserLanguage: 'en',
  workspaceId: undefined
}
