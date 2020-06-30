import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

const RefreshWarningMessage = props => (
  <div className='refreshWarningMessage'>
    <i className='fa fa-repeat' />
    {props.warningText}
    <button
      className='refreshWarningMessage__button'
      onClick={props.onClickRefresh}
      title={props.t('If you refresh, you will lose the current changes')}
    >
      {props.t('Refresh?')}
    </button>
  </div>
)

export default translate()(RefreshWarningMessage)

RefreshWarningMessage.propTypes = {
  warningText: PropTypes.string.isRequired,
  onClickRefresh: PropTypes.func.isRequired
}
