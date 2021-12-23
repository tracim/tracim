import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import IconButton from '../Button/IconButton.jsx'

const RefreshWarningMessage = props => (
  <IconButton
    customClass='refreshWarningMessage'
    onClick={props.onClickRefresh}
    icon='fas fa-redo'
    text={props.t('Refresh?')}
    title={props.tooltip}
  />
)

export default translate()(RefreshWarningMessage)

RefreshWarningMessage.propTypes = {
  tooltip: PropTypes.string.isRequired,
  onClickRefresh: PropTypes.func.isRequired
}
