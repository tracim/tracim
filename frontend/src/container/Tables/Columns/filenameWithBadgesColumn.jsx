import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { FilenameWithBadges, SORT_BY, stringIncludes, TitleListHeader } from 'tracim_frontend_lib'

const filenameWithBadgesColumn = (header, tooltip) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={header}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='favoriteTable__row__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={tooltip}
      />
    ),
    id: 'title',
    cell: props => (
      <FilenameWithBadges file={props.getValue().content} />
    ),
    className: 'TracimTable__styles__flex__4',
    filter: (data, userFilter) => {
      return stringIncludes(userFilter)(data.content.label)
    }
  })
}

export default filenameWithBadgesColumn
