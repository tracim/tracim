import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import CardPopup from '../CardPopup/CardPopup.jsx'
import IconButton from '../Button/IconButton.jsx'

// require('./DeleteCommentConfirm.styl')

export const DeleteCommentPopup = props => (
  <CardPopup
    customColor={props.customColor}
    onClose={props.onClickCancel}
    hideCloseBtn={false}
  >
    <div className='DeleteCommentPopup__body'>
      <div className='DeleteCommentPopup__body__msg'>{props.t('Are you sure?')}</div>

      <div className='DeleteCommentPopup__body__action'>
        <IconButton
          customClass={'DeleteCommentPopup__body__action__cancel'}
          icon={'fas fa-times'}
          text={props.t('Cancel')}
          title={props.t('Cancel')}
          type={'button'}
          intent='secondary'
          mode='dark'
          disabled={false}
          onClick={props.onClickCancel}
        />

        <IconButton
          color={props.customColor}
          icon={'far fa-trash-alt'}
          text={props.t('Delete')}
          title={props.t('Delete')}
          type={'button'}
          intent='primary'
          mode='light'
          disabled={false}
          onClick={props.onClickValidate}
        />
      </div>
    </div>
  </CardPopup>
)

export default translate()(DeleteCommentPopup)

DeleteCommentPopup.propTypes = {
  onClickCancel: PropTypes.func.isRequired,
  onClickValidate: PropTypes.func.isRequired,
  customColor: PropTypes.string
}

DeleteCommentPopup.defaultProps = {
  customColor: ''
}
