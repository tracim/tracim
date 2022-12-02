import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import IconButton from '../../component/Button/IconButton'

const spaceAddButtonColumn = (settings, onClick) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => '',
    id: 'addButton',
    cell: props => {
      return (
        <IconButton
          dataCy='spaceconfig__add_to_space'
          customClass='spaceconfig__table__leave_space_cell'
          mode='dark'
          intent='secondary'
          iconColor='green'
          onClick={(() => onClick(props.getValue()))}
          icon='fas fa-sign-in-alt'
          text={props.translate('Add to space')}
          title={props.translate('Add to space')}
        />
      )
    },
    className: settings.className,
  })
}

export default spaceAddButtonColumn
