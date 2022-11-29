import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import ContentType from '../../../component/ContentType.jsx'
import { stringIncludes } from 'tracim_frontend_lib'

const contentTypeColumn = (header, translate, contentType) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.content.type, {
    header: () => (
      <span>{header}</span>
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
    className: 'TracimTable__styles__flex__1',
    filter: (data, userFilter) => {
      const contentTypeInfo = contentType.find(info => info.slug === data.content.type)
      return contentTypeInfo && stringIncludes(userFilter)(translate(contentTypeInfo.label))
    }
  })
}

export default contentTypeColumn
