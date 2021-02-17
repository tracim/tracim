import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

require('./SearchFilterMenu.styl')

export const SearchFilterMenu = props => {
  return (
    <div className='searchFilterMenu'>
      <div className='searchFilterMenu__title'>
        <i className='fa-fw fas fa-sliders-h' />
        {props.t('Filters')}
        <button
          className='transparentButton'
          onClick={props.onClickSearchFilterMenu}
        >
          <i className='fa-fw fas fa-times' />
        </button>
      </div>
    </div>
  )
}

export default translate()(SearchFilterMenu)

SearchFilterMenu.propTypes = {
  onClickSearchFilterMenu: PropTypes.func.isRequired
}
