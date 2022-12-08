import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { stringIncludes } from '../../helper.js'
import { SORT_BY } from '../../sortListHelper.js'
import Breadcrumbs from '../../component/Breadcrumbs/Breadcrumbs.jsx'
import TitleListHeader from '../../component/Lists/ListHeader/TitleListHeader.jsx'
import { FilenameWithBadges } from '../../component/FilenameWithBadges/FilenameWithBadges.jsx'
import Icon from '../../component/Icon/Icon.jsx'

const contentFilenameWithBadgesAndBreadcrumbsColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='tracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={settings.tooltip}
      />
    ),
    id: 'titleWithPath',
    cell: props => (
      <>
        {props.getValue().content ? (
          <div className='contentListItem__name_path'>
            <FilenameWithBadges file={props.getValue().content} />
            <Breadcrumbs
              breadcrumbsList={props.getValue().breadcrumbs}
              keepLastBreadcrumbAsLink
            />
          </div>
        ) : (
          <div className='contentListItem__name_path unavailableContent__name_warning'>
            <span> {props.getValue().originalLabel}</span>
            <span className='unavailableContent__warning'>
              <Icon
                icon='fas fa-exclamation-triangle'
                title={props.translate('Warning')}
              />
              &nbsp;
              {props.translate('content is not available')}
            </span>
          </div>
        )}
      </>
    ),
    className: settings.className,
    filter: (data, userFilter) => {
      const includesFilter = stringIncludes(userFilter)
      const hasFilterMatchOnContentLabel = includesFilter(data.originalLabel)
      const hasFilterMatchOnBreadcrumbs = data.breadcrumbs && data.breadcrumbs.some(item => includesFilter(item.label))

      return hasFilterMatchOnContentLabel || hasFilterMatchOnBreadcrumbs
    }
  })
}

export default contentFilenameWithBadgesAndBreadcrumbsColumn
