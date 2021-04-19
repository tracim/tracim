import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import PropTypes from 'prop-types'
import DropdownMenu from '../../DropdownMenu/DropdownMenu.jsx'

// require('./SelectStatus.styl') // see https://github.com/tracim/tracim/issues/1156

export const SelectStatus = props => {
  return (
    <div className='selectStatus'>
      <DropdownMenu
        buttonDisabled={props.disabled}
        buttonOpts={
          <span style={{ color: props.selectedStatus ? props.selectedStatus.hexcolor : 'transparent' }}>
            <span className='selectStatus__dropdownbtn__label'>
              {props.t('Status:')}
            </span>
            <span className='selectStatus__dropdownbtn__selectedStatus__label'>
              {props.selectedStatus ? props.t(props.selectedStatus.label) : ''}
            </span>
            <span className='selectStatus__dropdownbtn__selectedStatus__icon'>
              <i className={`${props.selectedStatus ? props.selectedStatus.faIcon : ''}`} />
            </span>
          </span>
        }
        buttonTooltip={props.selectedStatus ? props.t(props.selectedStatus.label) : ''}
        buttonCustomClass='nohover selectStatus__dropdownbtn check btn outlineTextBtn'
        menuCustomClass='selectStatus__submenu'
        isButton
      >
        {props.availableStatus.map(s =>
          <button
            className='selectStatus__submenu__item transparentButton current'
            onClick={() => props.onChangeStatus(s.slug)}
            key={s.slug}
            style={{ ':hover': { backgroundColor: s.customColor } }}
          >
            {props.t(s.label)}
            <i
              className={`fa-fw ${s.faIcon}`}
              style={{ color: s.hexcolor }}
            />
          </button>
        )}
      </DropdownMenu>
    </div>
  )
}

export default translate()(Radium(SelectStatus))

SelectStatus.propTypes = {
  availableStatus: PropTypes.arrayOf(PropTypes.object),
  selectedStatus: PropTypes.object,
  disabled: PropTypes.bool,
  onChangeStatus: PropTypes.func
}

SelectStatus.defaultProps = {
  availableStatus: [],
  selectedStatus: {},
  disabled: false,
  onChangeStatus: () => {}
}
