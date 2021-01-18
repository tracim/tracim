// require('./ConfirmPopup.styl') // see https://github.com/tracim/tracim/issues/1156

import React from 'react'
import PropTypes from 'prop-types'
import CardPopup from '../CardPopup/CardPopup.jsx'
import { translate } from 'react-i18next'

const ConfirmPopup = (props) => (
  <CardPopup
    customClass='confirm_popup'
    customHeaderClass='primaryColorBg'
    onClose={props.onClose || props.onCancel}
  >
    <div className='confirm_popup__body'>
      <div className='confirm_popup__body__msg'>
        {props.msg || props.t('Are you sure?')}
      </div>
      <div className='confirm_popup__body__btn'>
        <button
          type='button'
          className='btn outlineTextBtn primaryColorBorder primaryColorFont nohover'
          data-cy='confirm_popup__button_cancel'
          onClick={props.onCancel}
        >
          {props.cancelLabel || props.t('Cancel')}
        </button>
        <button
          type='button'
          className='btn highlightBtn primaryColorBg primaryColorDarkenBgHover'
          data-cy='confirm_popup__button_confirm'
          onClick={props.onConfirm}
          autoFocus
        >
          {props.confirmLabel || props.t('Confirm')}
        </button>
      </div>
    </div>
  </CardPopup>
)

ConfirmPopup.propTypes = {
  cancelLabel: PropTypes.string,
  confirmLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  msg: PropTypes.any
}

ConfirmPopup.defaultProps = {
  cancelLabel: '',
  confirmLabel: '',
  msg: ''
}

export default translate()(ConfirmPopup)
