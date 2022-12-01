import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { stringIncludes } from '../../helper.js'
import { SORT_BY } from '../../sortListHelper.js'
import Breadcrumbs from '../../component/Breadcrumbs/Breadcrumbs.jsx'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader.jsx'
import { FilenameWithBadges } from '../../component/FilenameWithBadges/FilenameWithBadges.jsx'

const contentFilenameWithBadgesAndBreadcrumbsColumn = (header, tooltip) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={header}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='favoriteTable__row__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={tooltip}
      />
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

export default contentFilenameWithBadgesAndBreadcrumbsColumn
