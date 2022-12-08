import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { ROLE_LIST, stringIncludes } from '../../helper.js'
import DropdownMenu from '../../component/DropdownMenu/DropdownMenu'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader'
import { SORT_BY } from '../../sortListHelper'

const spaceRoleDropdownColumn = (settings, onClickChangeRole) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.ROLE)}
        customClass='tracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.ROLE}
        tootltip={settings.tooltip}
      />
    ),
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
