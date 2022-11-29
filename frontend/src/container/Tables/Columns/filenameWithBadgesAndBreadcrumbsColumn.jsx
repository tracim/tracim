import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import {
  Breadcrumbs,
  FilenameWithBadges,
  stringIncludes
} from 'tracim_frontend_lib'

const filenameWithBadgesAndBreadcrumbsColumn = (header) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => (
      <span>{header}</span>
    ),
    id: 'titleWithPath',
    cell: props => (
      <div className='contentListItem__name_path'>
        <FilenameWithBadges file={props.getValue().content} />
        <Breadcrumbs
          breadcrumbsList={props.getValue().breadcrumbs}
          keepLastBreadcrumbAsLink
        />
      </div>
    ),
    className: 'TracimTable__styles__flex__4',
    filter: (data, userFilter) => {
      const includesFilter = stringIncludes(userFilter)
      const hasFilterMatchOnContentLabel = includesFilter(data.content.label)
      const hasFilterMatchOnBreadcrumbs = data.breadcrumbs.some(item => includesFilter(item.label))

      return hasFilterMatchOnContentLabel || hasFilterMatchOnBreadcrumbs
    }
  })
}

export default filenameWithBadgesAndBreadcrumbsColumn
