import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import PropTypes from 'prop-types'
import DropdownMenu from '../../DropdownMenu/DropdownMenu.jsx'
import IconButton from '../../Button/IconButton.jsx'

// require('./SelectStatus.styl') // see https://github.com/tracim/tracim/issues/1156

export const SelectStatus = props => {
  return (
    <div className='selectStatus'>
      <DropdownMenu
        buttonDisabled={props.disabled}
        buttonIcon={props.selectedStatus ? props.selectedStatus.faIcon : ''}
        buttonIconColor={props.selectedStatus ? props.selectedStatus.hexcolor : 'transparent'}
        buttonLabel={props.selectedStatus ? props.t(props.selectedStatus.label) : ''}
        buttonTooltip={`${props.t('Status:')} ${props.selectedStatus ? props.t(props.selectedStatus.label) : ''}`}
        buttonCustomClass='selectStatus__dropdownbtn'
      >
        {props.availableStatus.map(status =>
          <IconButton
            customClass='transparentButton'
            key={status.slug}
            text={props.t(status.label)}
            textMobile={props.t(status.label)}
            icon={status.faIcon}
            iconColor={status.hexcolor}
            onClick={() => props.onChangeStatus(status.slug)}
          />
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
