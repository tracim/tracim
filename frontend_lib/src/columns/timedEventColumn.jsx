import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { getRevisionTypeLabel } from '../helper.js'

import { SORT_BY } from '../sortListHelper.js'
import TimedEvent from '../component/TimedEvent/TimedEvent.jsx'
import TitleListHeader from '../component/Lists/ListHeader/TitleListHeader.jsx'

const timedEventColumn = (settings, t) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => {
    if (!row.content || !row.content.lastModifier) return undefined
    return row.content.lastModifier.publicName
  }, {
    header: props => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.MODIFICATION_DATE)}
        customClass='tracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.MODIFICATION_DATE}
        tootltip={settings.tooltip}
      />
    ),
    id: 'lastModification',
    cell: props => {
      if (!props.row.original.content) return null

      return (
        <TimedEvent
          customClass='contentListItem__modification'
          operation={getRevisionTypeLabel(props.row.original.content.currentRevisionType, t)}
          date={props.row.original.content.modified}
          lang='fr'
          author={props.row.original.content.lastModifier}
        />
      )
    },
    className: settings.className,
    filterFn: 'includesString'
  })
}

export default timedEventColumn
