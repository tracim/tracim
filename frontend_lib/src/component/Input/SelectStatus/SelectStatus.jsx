import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'

// require('./SelectStatus.styl') // see https://github.com/tracim/tracim/issues/1156

export const SelectStatus = props => {
  return (
    <div className='selectStatus dropdown'>
      <button
        className='selectStatus__dropdownbtn check btn outlineTextBtn nohover dropdown-toggle'
        type='button'
        id='dropdownMenu2'
        data-toggle='dropdown'
        aria-haspopup='true'
        aria-expanded='false'
        style={{color: props.selectedStatus ? props.selectedStatus.hexcolor : 'transparent'}}
        disabled={props.disabled}
      >
        <span className='selectStatus__dropdownbtn__label'>{props.t('Status')}:</span>
        {props.selectedStatus ? props.t(props.selectedStatus.label) : ''}
        <div className='selectStatus__dropdownbtn__icon'>
          <i className={`fa fa-${props.selectedStatus ? props.selectedStatus.faIcon : ''}`} />
        </div>
      </button>

      <div className='selectStatus__submenu dropdown-menu' aria-labelledby='dropdownMenu2'>
        {props.availableStatus.map(s =>
          <button
            className='selectStatus__submenu__item current dropdown-item'
            type='button'
            onClick={() => props.onChangeStatus(s.slug)}
            key={`status_${s.slug}`}
            style={{
              ':hover': {
                backgroundColor: s.customColor
              }
            }}
          >
            {props.t(s.label)}
            <div className='selectStatus__submenu__item__icon'>
              <i
                className={`fa fa-fw fa-${s.faIcon}`}
                style={{color: s.hexcolor}}
              />
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

export default Radium(translate()(SelectStatus))
