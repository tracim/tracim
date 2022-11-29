import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import {
  Icon,
  stringIncludes
} from 'tracim_frontend_lib'

const contentInformationColumn = (header, translate, contentType) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.content, {
    header: () => (
      <span>{header}</span>
    ),
    id: 'information',
    cell: props => {
      const contentTypeInfo = contentType.find(info => info.slug === props.getValue().type)
      const statusInfo = contentTypeInfo.availableStatuses.find(
        s => s.slug === props.getValue().statusSlug
      )

      return (
        <div className='contentListItem__information'>
          <span className='contentListItem__information__status'>
            <Icon
              icon={`${statusInfo.faIcon}`}
              title={translate(statusInfo.label)}
              color={statusInfo.hexcolor}
            />
            <span
              title={translate(statusInfo.label)}
            >
              {translate(statusInfo.label)}
            </span>
          </span>
        </div>
      )
    },
    className: 'TracimTable__styles__flex__1 TracimTable__hide__md',
    filter: (data, userFilter) => {
      const contentTypeInfo = contentType.find(info => info.slug === data.content.type)
      const statusInfo = contentTypeInfo.availableStatuses.find(
        s => s.slug === data.content.statusSlug
      )
      return statusInfo && stringIncludes(userFilter)(translate(statusInfo.label))
    }
  })
}

export default contentInformationColumn
