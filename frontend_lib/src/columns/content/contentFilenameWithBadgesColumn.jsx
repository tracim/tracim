import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { stringIncludes } from '../../helper.js'
import { SORT_BY } from '../../sortListHelper.js'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader.jsx'
import { FilenameWithBadges } from '../../component/FilenameWithBadges/FilenameWithBadges.jsx'

const contentFilenameWithBadgesColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='favoriteTable__row__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={settings.tooltip}
      />
    ),
    id: 'title',
    cell: props => (
      <FilenameWithBadges file={props.getValue().content} />
    ),
    className: settings.className,
    filter: (data, userFilter) => {
      return stringIncludes(userFilter)(data.content.label)
    }
  })
}

export default contentFilenameWithBadgesColumn
