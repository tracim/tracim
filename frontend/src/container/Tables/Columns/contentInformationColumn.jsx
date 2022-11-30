import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import {
  Icon, SORT_BY,
  stringIncludes, TitleListHeader
} from 'tracim_frontend_lib'

const contentInformationColumn = (header, tooltip, contentType) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.content, {
    header: (props) => (
      <TitleListHeader
        title={header}
        onClickTitle={() => props.onClickTitle(SORT_BY.STATUS)}
        customClass='favoriteTable__row__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.STATUS}
        tootltip={tooltip}
      />
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
              title={props.translate(statusInfo.label)}
              color={statusInfo.hexcolor}
            />
            <span
              title={props.translate(statusInfo.label)}
            >
              {props.translate(statusInfo.label)}
            </span>
          </span>
        </div>
      )
    },
    className: 'TracimTable__styles__flex__2 TracimTable__hide__md',
    filter: (data, userFilter, translate) => {
      const contentTypeInfo = contentType.find(info => info.slug === data.content.type)
      const statusInfo = contentTypeInfo.availableStatuses.find(
        s => s.slug === data.content.statusSlug
      )
      return statusInfo && stringIncludes(userFilter)(translate(statusInfo.label))
    }
  })
}

export default contentInformationColumn
