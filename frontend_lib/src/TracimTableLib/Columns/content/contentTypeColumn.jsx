import React from 'react'
import classnames from 'classnames'
import { createColumnHelper } from '@tanstack/react-table'
import ContentType from '../../../component/ContentType/ContentType.jsx'

const contentTypeColumn = (settings, contentType, t) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => {
    const contentTypeInfo = contentType.find(info => info.slug === row.originalType) || { label: '' }
    return t(contentTypeInfo.label)
  }, {
    header: () => (
      <span>{settings.header}</span>
    ),
    id: settings.id,
    cell: props => {
      const contentTypeInfo = contentType.find(info => info.slug === props.row.original.originalType)
      return (
        <ContentType
          contentTypeInfo={contentTypeInfo}
        />
      )
    },
    tooltip: settings.tooltip,
    className: settings.className,
    style: classnames(settings.style),
    filterFn: 'includesString'
  })
}

export default contentTypeColumn
