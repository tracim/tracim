import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { isMobile } from 'react-device-detect'

import BtnSwitch from '../../component/Input/BtnSwitch/BtnSwitch.jsx'

const toggleButtonColumn = (settings, id, onChange, checked, disabled = () => false) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => (
      <span>{settings.header}</span>
    ),
    id: id,
    cell: props => {
      return (
        <BtnSwitch
          checked={checked(props.getValue())}
          onChange={e => onChange(e, props.getValue())}
          activeLabel={isMobile ? '' : props.translate('Activated')}
          inactiveLabel={isMobile ? '' : props.translate('Deactivated')}
          disabled={disabled(props.getValue())}
          smallSize={isMobile}
        />
      )
    },
    className: settings.className
  })
}

export default toggleButtonColumn
