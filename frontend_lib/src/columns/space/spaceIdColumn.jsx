import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { stringIncludes } from '../../helper'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader'
import { SORT_BY } from '../../sortListHelper'

const spaceIdColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.id, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.ID)}
        customClass='tracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.ID}
        tootltip={settings.tooltip}
      />
    ),
    id: 'spaceId',
    cell: props => {
      return (
        <span>{props.getValue()}</span>
      )
    },
    className: settings.className,
    filter: (data, userFilter) => {
      return stringIncludes(userFilter)(data.id.toString())
    }
  })
}

spaceIdColumn.propsType = {}

spaceIdColumn.defaultProps = {}

export default spaceIdColumn
