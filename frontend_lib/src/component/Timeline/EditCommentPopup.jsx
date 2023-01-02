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
          onClickSubmit={
            (comment, fileList) => {
              props.onClickValidate(comment, props.commentId, props.parentId)
              return true
            }
          }
          codeLanguageList={props.codeLanguageList}
          contentId={props.commentId}
          contentType={CONTENT_TYPE.COMMENT}
          customClass='editCommentPopup'
          customColor={props.customColor}
          isAdvancedEdition
          isDisplayedAdvancedEdition={false}
          isDisplayedCancel
          isDisplayedUploadFile={false}
          newComment={state.newComment}
          onClickWithstand={props.onClickClose}
          roleList={[{
            id: 0,
            label: props.t('All'),
            slug: props.t('all')
          }]}
          memberList={props.memberList}
          submitLabel={props.t('Send')}
          withstandLabel={props.t('Cancel')}
          workspaceId={props.workspaceId}
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
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

EditCommentPopup.defaultProps = {
  codeLanguageList: [],
  commentId: 0,
  customColor: undefined,
  loggedUserLanguage: 'en',
  memberList: [],
  parentId: 0,
  workspaceId: undefined,
}
