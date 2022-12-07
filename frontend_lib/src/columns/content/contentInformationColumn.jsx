import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { stringIncludes } from '../../helper.js'
import { SORT_BY } from '../../sortListHelper.js'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader.jsx'
import Icon from '../../component/Icon/Icon.jsx'

const contentInformationColumn = (settings, contentType) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.STATUS)}
        customClass='TracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.STATUS}
        tootltip={settings.tooltip}
      />
    ),
    id: 'information',
    cell: props => {
      if (!props.getValue().content) return null

      const contentTypeInfo = contentType.find(info => info.slug === props.getValue().content.type)
      const statusInfo = contentTypeInfo.availableStatuses.find(
        s => s.slug === props.getValue().content.statusSlug
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
    className: settings.className,
    filter: (data, userFilter, translate) => {
      if (!data.content) return false

      const contentTypeInfo = contentType.find(info => info.slug === data.content.type)
      const statusInfo = contentTypeInfo.availableStatuses.find(
        s => s.slug === data.content.statusSlug
      )
      return statusInfo && stringIncludes(userFilter)(translate(statusInfo.label))
    }
  })
}

export default contentInformationColumn