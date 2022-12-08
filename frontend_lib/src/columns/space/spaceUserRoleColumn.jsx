import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { ROLE_LIST, stringIncludes } from '../../helper.js'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader'
import { SORT_BY } from '../../sortListHelper'

const spaceUserRoleColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.member.role, {
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
    },
    className: settings.className,
    filter: (data, userFilter, translate) => {
      const userRole = ROLE_LIST.find(type => type.slug === data.member.role) || { label: '' }

      return userRole && stringIncludes(userFilter)(translate(userRole.label))
    }
  })
}

export default spaceUserRoleColumn
