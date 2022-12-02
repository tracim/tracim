import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { ROLE_LIST, stringIncludes } from '../../helper.js'
import DropdownMenu from '../../component/DropdownMenu/DropdownMenu'

const spaceRoleDropdownColumn = (settings, onClickChangeRole) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => '',
    id: 'spaceLeaveButtonColumn',
    cell: props => {
      const memberRole = ROLE_LIST.find(r => r.slug === props.getValue().member.role)

      return (
        <DropdownMenu
          buttonOpts={<i className={`fas fa-fw fa-${memberRole.faIcon}`} style={{ color: memberRole.hexcolor }} />}
          buttonLabel={props.translate(memberRole.label)}
          buttonCustomClass='nohover btndropdown transparentButton'
          isButton
        >
          {ROLE_LIST.map(r =>
            <button
              className='transparentButton'
              onClick={() => onClickChangeRole(props.getValue(), r)}
              key={`role_${r.slug}`}
            >
              <i className={`fas fa-fw fa-${r.faIcon}`} style={{ color: r.hexcolor }} />
              {props.translate(r.label)}
            </button>
          )}
        </DropdownMenu>
      )
    },
    className: settings.className, // '',
    filter: (data, userFilter, translate) => {
      const userRole = ROLE_LIST.find(type => type.slug === data.member.role) || { label: '' }

      return userRole && stringIncludes(userFilter)(translate(userRole.label))
    }
  })
}

export default spaceRoleDropdownColumn
