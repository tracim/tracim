import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { IconButton, TextInput } from 'tracim_frontend_lib'

require('./FilterNotificationButton.styl')

export const FilterNotificationButton = props => {
  const [isInputOpen, setIsInputOpen] = useState(false)

  const onClickFilterButton = () => {
    setIsInputOpen(prev => !prev)
    props.onChangeFilterInput('')
  }

  return (
    <>
      {isInputOpen && (
        <TextInput
          className='FilterNotificationButton__input'
          onChange={e => props.onChangeFilterInput(e.target.value)}
          value={props.filterInputValue}
          placeholder={props.t('Filter...')}
          autoFocus
        />
      )}
      <IconButton
        icon={isInputOpen ? 'fas fa-times' : 'fas fa-filter'}
        onClick={onClickFilterButton}
        title={props.t('Filter notifications')}
      />
    </>
  )
}

FilterNotificationButton.propTypes = {
  onChangeFilterInput: PropTypes.func,
  filterInputValue: PropTypes.string
}

FilterNotificationButton.defaultProps = {
  onChangeFilterInput: () => {},
  filterInputValue: ''
}

export default translate()(FilterNotificationButton)
