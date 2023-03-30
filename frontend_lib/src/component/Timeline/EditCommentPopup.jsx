import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import { TracimComponent } from '../../tracimComponent.js'
import { appContentFactory } from '../../appContentFactory.js'
import { CUSTOM_EVENT } from '../../customEvent.js'
import { CONTENT_TYPE } from '../../helper.js'
import { DEFAULT_ROLE_LIST } from '../../mentionOrLink.js'
import CardPopup from '../CardPopup/CardPopup.jsx'
import CommentArea from './CommentArea.jsx'

// require('./EditCommentPopup.styl') // see https://github.com/tracim/tracim/issues/1156

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

  handleAllAppChangeLanguage = (data) => {
    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, true)
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
          onClickSubmit={(comment, fileList) => {
            props.onClickValidate(comment, props.commentId, props.parentId)
            return true
          }}
          workspaceId={props.workspaceId}
          // End of required props /////////////////////////////////////////////
          codeLanguageList={props.codeLanguageList}
          customClass='editCommentPopup'
          customColor={props.customColor}
          isAdvancedEdition
          isDisplayedAdvancedEditionButton={false}
          isDisplayedCancelButton
          isDisplayedUploadFileButton={false}
          language={props.loggedUserLanguage}
          newComment={state.newComment}
          onClickWithstand={props.onClickClose}
          roleList={DEFAULT_ROLE_LIST}
          memberList={props.memberList}
          submitLabel={props.t('Send')}
          withstandLabel={props.t('Cancel')}
        />
      </CardPopup>
    )
  }
}
export default translate()(appContentFactory(TracimComponent(EditCommentPopup)))

EditCommentPopup.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  comment: PropTypes.string.isRequired,
  onClickClose: PropTypes.func.isRequired,
  onClickValidate: PropTypes.func.isRequired,
  codeLanguageList: PropTypes.array,
  commentId: PropTypes.number,
  customColor: PropTypes.string,
  loggedUserLanguage: PropTypes.string,
  memberList: PropTypes.array,
  parentId: PropTypes.number,
  // NOTE - MP - 2023-01-06 - There is no workspaceId in string
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}

EditCommentPopup.defaultProps = {
  codeLanguageList: [],
  commentId: 0,
  customColor: undefined,
  loggedUserLanguage: 'en',
  memberList: [],
  parentId: 0,
  workspaceId: undefined
}
