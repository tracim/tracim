import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { ROLE } from '../../helper.js'

// TODO set in nested object
const userRemoveButton = (userRoleIdInWorkspace, loggedUser, onClickRemoveMember) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => '',
    id: 'deleteButton',
    cell: props => {
      return (
        <>
          {userRoleIdInWorkspace >= ROLE.workspaceManager.id && props.getValue().id !== loggedUser.userId && (
            <div
              className='memberlist__list__item__delete primaryColorFontHover'
              onClick={() => onClickRemoveMember(props.getValue().id)}
            >
              <i className='far fa-trash-alt' />
            </div>
          )}
        </>
      )
    }
  })
}

export default userRemoveButton
