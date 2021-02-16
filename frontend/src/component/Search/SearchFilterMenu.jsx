import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'

require('./SearchFilterMenu.styl')

export const SearchFilterMenu = props => {
  return (
    <div className='searchFilterMenu'>
      <div className='searchFilterMenu__title'>
        <Icon
          icon='fa-fw fas fa-sliders-h'
          title={props.t('Filters')}
        />
        {props.t('Filters')}
        <button
          className='transparentButton'
          onClick={props.onClickSearchFilterMenu}
        >
          <Icon
            icon='fa-fw fas fa-times'
            title={props.t('Close')}
          />
        </button>
      </div>
    </div>
  )
}

export default translate()(SearchFilterMenu)

SearchFilterMenu.propTypes = {
  onClickSearchFilterMenu: PropTypes.func.isRequired,
  simpleFacets: PropTypes.object,
  dateRangeFacets: PropTypes.object
}

SearchFilterMenu.defaultProps = {
  simpleFacets: {},
  dateRangeFacets: {}
}
