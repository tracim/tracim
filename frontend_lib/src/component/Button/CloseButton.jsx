import PropTypes from 'prop-types'
import React from 'react'
import { translate } from 'react-i18next'
import Icon from '../Icon/Icon.jsx'

const CloseButton = (props) => (
  <button className={`transparentButton ${props.customClass}`} onClick={props.onClick}>
    <Icon icon='fas fa-times' title={props.t('Close')} />
  </button>
)

export default translate()(CloseButton)

CloseButton.propTypes = {
  customClass: PropTypes.string,
  onClick: PropTypes.func.isRequired
}

CloseButton.defaultProps = {
  customClass: ''
}
