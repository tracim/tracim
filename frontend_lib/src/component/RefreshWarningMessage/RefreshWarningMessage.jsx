import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

const RefreshWarningMessage = props => (
  <div className='refreshWarningMessage'>
    <i className='fa fa-exclamation-triangle' />
    {props.t('The content has been modified by {{author}}', { author: props.editionAuthor, interpolation: { escapeValue: false } })}
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
  editionAuthor: PropTypes.string,
  onClickRefresh: PropTypes.func
}

RefreshWarningMessage.defaultState = {
  editionAuthor: '',
  onClickRefresh: () => { }
}
