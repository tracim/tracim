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
      >
        {props.selectedStatus ? props.selectedStatus.label : ''}
        <div className='selectStatus__dropdownbtn__icon'>
          <i className={`fa fa-${props.selectedStatus ? props.selectedStatus.faIcon : ''}`} />
        </div>
      </button>

      <div className='selectStatus__submenu dropdown-menu' aria-labelledby='dropdownMenu2'>
        <h6 className='dropdown-header'>{props.t('Input.SelectStatus.file_status')}</h6>

        <div className='dropdown-divider' />

        {props.availableStatus.map(s =>
          <button
            className='selectStatus__submenu__item current dropdown-item'
            type='button'
            onClick={() => props.onChangeStatus(s.slug)}
            key={`status_${s.slug}`}
            style={{color: s.hexcolor}}
          >
            {s.label /* props.t('Input.SelectStatus.ongoing') */}
            <div className='selectStatus__submenu__item__icon'>
              <i className={`fa fa-${s.faIcon}`} />
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

export default translate()(SelectStatus)
