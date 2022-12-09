import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { stringIncludes } from '../../helper.js'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader.jsx'

const spanColumn = (settings, accessor, id, sortBy) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(accessor, {
    header: props => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(sortBy)}
        customClass='tracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === sortBy}
        tootltip={settings.tooltip}
      />
    ),
    id: id,
    cell: props => {
      return (
        <span>{props.getValue()}</span>
      )
    },
    className: settings.className,
    filter: (data, userFilter) => {
      return stringIncludes(userFilter)(accessor(data).toString())
    }
  })
}

export default spanColumn
