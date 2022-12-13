import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import ContentType from '../../component/ContentType/ContentType.jsx'

import { stringIncludes } from '../../helper.js'
import { SORT_BY } from '../../sortListHelper.js'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader.jsx'

const contentTypeColumn = (settings, contentType) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: props => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.CONTENT_TYPE)}
        customClass='tracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.CONTENT_TYPE}
        tootltip={settings.tooltip}
      />
    ),
    id: 'type',
    cell: props => {
      const contentTypeInfo = contentType.find(info => info.slug === props.getValue().originalType)
      return (
        <ContentType
          contentTypeInfo={contentTypeInfo}
        />
      )
    },
    className: settings.className,
    filter: (data, userFilter, translate) => {
      const contentTypeInfo = contentType.find(info => info.slug === data.originalType)
      return contentTypeInfo && stringIncludes(userFilter)(translate(contentTypeInfo.label))
    }
  })
}

export default contentTypeColumn
