import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import ContentType from '../../../component/ContentType.jsx'
import { SORT_BY, stringIncludes, TitleListHeader } from 'tracim_frontend_lib'

const contentTypeColumn = (header, tooltip, contentType) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.content.type, {
    header: (props) => (
      <TitleListHeader
        title={header}
        onClickTitle={() => props.onClickTitle(SORT_BY.CONTENT_TYPE)}
        customClass='favoriteTable__row__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.CONTENT_TYPE}
        tootltip={tooltip}
      />
    ),
    id: 'type',
    cell: props => {
      const contentTypeInfo = contentType.find(info => info.slug === props.getValue())
      return (
        <ContentType
          contentTypeInfo={contentTypeInfo}
        />
      )
    },
    className: 'TracimTable__styles__width__icon',
    filter: (data, userFilter, translate) => {
      const contentTypeInfo = contentType.find(info => info.slug === data.content.type)
      return contentTypeInfo && stringIncludes(userFilter)(translate(contentTypeInfo.label))
    }
  })
}

export default contentTypeColumn
