import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../../../i18n.js'

require('./SelectStatus.styl')

export const SelectStatus = props => {
  translate.setI18n(props.i18n ? props.i18n : i18n) // mandatory to allow Apps to overrides trad

  return (
    <div className='selectStatus dropdown'>
      <button
        className='selectStatus__dropdownbtn check btn dropdown-toggle'
        type='button'
        id='dropdownMenu2'
        data-toggle='dropdown'
        aria-haspopup='true'
        aria-expanded='false'
        style={{color: props.selectedStatus ? props.selectedStatus.hexcolor : 'transparent'}}
        disabled={props.disabled}
      >
        <span className='selectStatus__dropdownbtn__label'>Status :</span>
        {props.selectedStatus ? props.selectedStatus.label : ''}
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
            // style={{color: s.hexcolor}}
          >
            {s.label}
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

export default translate()(SelectStatus)
