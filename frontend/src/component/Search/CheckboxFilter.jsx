import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'

export const CheckboxFilter = props => {
  return (
    <>
      <div className='searchFilterMenu__content__item__title'>
        <button
          className='transparentButton'
          onClick={props.onClickOpenOrCloseFilter}
        >
          <Icon
            icon={props.showFilter
              ? 'fa-fw fas fa-caret-down'
              : 'fa-fw fas fa-caret-right'}
            title={props.showFilter
              ? props.t('Hide {{filter}}', { filter: props.label })
              : props.t('Show {{filter}}', { filter: props.label })}
          />
        </button>
        {props.label}
      </div>

      {props.showFilter &&
        props.filterList.map(item =>
          <div className='searchFilterMenu__content__item__checkbox' key={`item__${item.value}`}>
            <input
              type='checkbox'
              id={`item__${item.value}`}
              onChange={(e) => props.onChangeSearchFacets(e.currentTarget.checked ? item.value : '')}
            />
            <label htmlFor={`item__${item.value}`}>
              {props.t(`${item.value}`)} ({item.count})
            </label>
          </div>
        )}
    </>
  )
}

export default translate()(CheckboxFilter)

CheckboxFilter.propTypes = {
  filterList: PropTypes.array.isRequired,
  label: PropTypes.string,
  onChangeSearchFacets: PropTypes.func,
  onClickOpenOrCloseFilter: PropTypes.func,
  showFilter: PropTypes.bool
}

CheckboxFilter.defaultProps = {
  label: '',
  onChangeSearchFacets: () => {},
  onClickOpenOrCloseFilter: () => {},
  showFilter: true
}
