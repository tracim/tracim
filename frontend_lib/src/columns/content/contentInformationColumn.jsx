import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import Icon from '../../component/Icon/Icon.jsx'

const contentInformationColumn = (settings, contentType, t) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => {
    if (!row.content) return undefined
    const contentTypeInfo = contentType.find(info => info.slug === row.content.type) || { label: '' }
    const statusInfo = contentTypeInfo.availableStatuses.find(
      s => s.slug === row.content.statusSlug
    ) || { label: '' }

    return t(statusInfo.label)
  }, {
    header: () => (
      <span>{settings.header}</span>
    ),
    id: 'information',
    cell: props => {
      if (!props.row.original.content) return null

      const contentTypeInfo = contentType.find(info => info.slug === props.row.original.content.type) || { label: '' }
      const statusInfo = contentTypeInfo.availableStatuses.find(
        s => s.slug === props.row.original.content.statusSlug
      ) || { label: '' }

      return (
        <div className='contentListItem__information'>
          <span className='contentListItem__information__status'>
            <Icon
              icon={`${statusInfo.faIcon}`}
              title={t(statusInfo.label)}
              color={statusInfo.hexcolor}
            />
            <span
              title={t(statusInfo.label)}
            >
              {t(statusInfo.label)}
            </span>
          </span>
        </div>
      )
    },
    className: settings.className,
    filterFn: 'includesString'
  })
}

export default contentInformationColumn
