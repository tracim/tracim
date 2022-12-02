import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import IconButton from '../../component/Button/IconButton.jsx'

const spaceLeaveButtonColumn = (onClick, admin, system, onlyManager) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => '',
    id: 'leaveButton',
    cell: props => {
      const isOnlyManager = onlyManager(props.getValue().member, props.getValue().memberList)
      return (
        <IconButton
          dataCy='spaceconfig__remove_from_space'
          customClass='spaceconfig__table__leave_space_cell'
          mode='dark'
          intent='secondary'
          iconColor='red'
          disabled={isOnlyManager}
          onClick={(() => onClick(props.getValue().id))}
          icon='fas fa-sign-out-alt'
          text={admin ? props.translate('Remove from space') : props.translate('Leave space')}
          title={
            isOnlyManager
              ? (
                admin
                  ? props.translate('You cannot remove this member because there are no other space managers.')
                  : props.translate('You cannot leave this space because there are no other space managers.')
              )
              : admin ? props.translate('Remove from space') : props.translate('Leave space')
          }
        />
      )
    },
    className: 'TracimTable__styles__flex__1'
  })
}

export default spaceLeaveButtonColumn
