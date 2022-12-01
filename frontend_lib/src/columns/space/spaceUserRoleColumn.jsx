import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { ROLE_LIST } from '../../helper.js'

const spaceUserRoleColumn = (header) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.space.member.role, {
    header: () => (
      <span>{header}</span>
    ),
    id: 'spaceUserRole',
    cell: props => {
      const memberRole = ROLE_LIST.find(r => r.slug === props.getValue())

      return (
        <div className='spaceconfig__table__role'>
          <div className='spaceconfig__table__role__icon'>
            <i className={`fa-fw ${memberRole.faIcon}`} style={{ color: memberRole.hexcolor }} />
          </div>
          <div className='spaceconfig__table__role__text d-none d-sm-flex'>
            {props.translate(memberRole.label)}
          </div>
        </div>
      )
    }
  })
}

export default spaceUserRoleColumn
