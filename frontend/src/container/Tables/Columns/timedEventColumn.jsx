import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import {
  TimedEvent,
  stringIncludes, TitleListHeader, SORT_BY
} from 'tracim_frontend_lib'
import { getRevisionTypeLabel } from '../../../util/helper.js'

const timedEventColumn = (header, tooltip) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.content, {
    header: (props) => (
      <TitleListHeader
        title={header}
        onClickTitle={() => props.onClickTitle(SORT_BY.MODIFICATION_DATE)}
        customClass='favoriteTable__row__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.MODIFICATION_DATE}
        tootltip={tooltip}
      />
    ),
    id: 'lastModification',
    cell: props => (
      <TimedEvent
        customClass='contentListItem__modification'
        operation={getRevisionTypeLabel(props.getValue().currentRevisionType, props.translate)}
        date={props.getValue().modified}
        lang='fr'
        author={props.getValue().lastModifier}
      />
    ),
    className: 'TracimTable__styles__flex__2  TracimTable__hide__md',
    filter: (data, userFilter) => {
      if (!data.content.lastModifier) return false
      return stringIncludes(userFilter)(data.content.lastModifier.publicName)
    }
  })
}

export default timedEventColumn
