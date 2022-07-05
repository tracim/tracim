import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Checkbox, Icon } from 'tracim_frontend_lib'

require('./CheckboxFilter.styl')

export const CheckboxFilter = props => {
  return (
    <div className='checkboxFilter'>
      <div className='checkboxFilter__title'>
        <button
          className='transparentButton'
          onClick={props.onClickOpenOrCloseFilter}
        >
          <Icon
            icon={props.showFilter
              ? 'fas fa-caret-down'
              : 'fas fa-caret-right'}
            title={props.showFilter
              ? props.t('Hide {{filter}}', { filter: props.label })
              : props.t('Show {{filter}}', { filter: props.label })}
          />
        </button>
        {props.label}
      </div>

      {props.showFilter && props.filterList.map(item =>
        <div className='checkboxFilter__checkbox' key={`item__${item.id}`}>
          <div className='checkboxFilter__checkbox__input'>
            <Checkbox
              name={item.id}
              onClickCheckbox={() => props.onChangeSearchFacets(item.id)}
              checked={props.checkedFilterIdList.findIndex(filter => filter === item.id) !== -1}
              styleCheck={{ top: '-5px' }}
            />
          </div>
          <label className='checkboxFilter__checkbox__label' htmlFor={`checkbox-${item.id}`}>
            {props.t(item.value)}{item.count && ` (${item.count})`}
          </label>
        </div>
      )}
    </div>
  )
}

export default translate()(CheckboxFilter)

CheckboxFilter.propTypes = {
  filterList: PropTypes.array.isRequired,
  checkedFilterIdList: PropTypes.arrayOf(PropTypes.string),
  label: PropTypes.string,
  onChangeSearchFacets: PropTypes.func,
  onClickOpenOrCloseFilter: PropTypes.func,
  showFilter: PropTypes.bool
}

CheckboxFilter.defaultProps = {
  checkedFilterIdList: [],
  label: '',
  onChangeSearchFacets: () => {},
  onClickOpenOrCloseFilter: () => {},
  showFilter: true
}
