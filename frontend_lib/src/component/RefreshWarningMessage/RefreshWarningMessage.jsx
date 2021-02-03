import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

const RefreshWarningMessage = props => (
  <button
    className='refreshWarningMessage'
    onClick={props.onClickRefresh}
    title={props.tooltip}
  >
    <i
      className='fas fa-redo'
      onClick={props.onClickRefresh}
    />
    <div className='refreshWarningMessage__text'>
      {props.t('Refresh?')}
    </div>
  </button>
)

export default translate()(RefreshWarningMessage)

RefreshWarningMessage.propTypes = {
  warningText: PropTypes.string.isRequired,
  onClickRefresh: PropTypes.func.isRequired
}
