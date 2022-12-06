import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { SORT_BY } from '../../sortListHelper'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader.jsx'
import { stringIncludes } from '../../helper'

const spaceNameColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.label, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='TracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={settings.tooltip}
      />
    ),
    id: 'spaceName',
    cell: props => {
      return (
        <span>{props.getValue()}</span>
      )
    },
    className: settings.className,
    filter: (data, userFilter) => {
      return stringIncludes(userFilter)(data.label)
    }
  })
}

export default spaceNameColumn
