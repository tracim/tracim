import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import ListItemRowWrapper from '../../RowWrappers/ListItemRowWrapper.jsx'

import {
  TracimTable,
  contentTypeColumn,
  contentFilenameWithBadgesAndBreadcrumbsColumn,
  contentInformationColumn,
  favoriteButtonColumn,
  timedEventColumn
} from 'tracim_frontend_lib'

require('./FavoriteTable.styl')

//  TODO: Manage Unavailable content

//         <UnavailableContent
//           contentTypeInfo={contentTypeInfo}
//           label={favorite.originalLabel}
//           key={favorite.contentId}
//           isLast={isLast}
//           isFirst={isFirst}
//         >
//           {favoriteButton}
//         </UnavailableContent>

// const UnavailableContent = translate()(props => {
//   return (
//     <ListItemWrapper
//       label={props.label}
//       read
//       contentType={props.contentTypeInfo}
//       isLast={props.isLast}
//       isFirst={props.isFirst}
//       customClass='unavailableContent contentListItem'
//     >
//       <ContentType
//         contentTypeInfo={props.contentTypeInfo}
//         customClass='contentListItem__type'
//       />
//       <div className='contentListItem__name_path unavailableContent__name_warning'>
//         {props.label}
//         <span className='unavailableContent__warning'>
//           <Icon
//             icon='fas fa-exclamation-triangle'
//             title={props.t('Warning')}
//           />
//           &nbsp;
//           {props.t('content is not available')}
//         </span>
//       </div>
//       {props.children}
//     </ListItemWrapper>
//   )
// })

const FavoritesTable = (props) => {
  const columns = [
    contentTypeColumn({
      header: props.t('Type'),
      tooltip: props.t('Sort by type'),
      className: 'TracimTable__styles__width__icon'
    }, props.contentType),

    contentFilenameWithBadgesAndBreadcrumbsColumn({
      header: props.t('Title and path'),
      tooltip: props.t('Sort by title'),
      className: 'TracimTable__styles__flex__4'
    }),

    timedEventColumn({
      header: props.t('Last Modification'),
      tooltip: props.t('Sort by last modification'),
      className: 'TracimTable__styles__flex__2  TracimTable__hide__md'
    }),

    contentInformationColumn({
      header: props.t('Information'),
      tooltip: props.t('Sort by information'),
      className: 'TracimTable__styles__flex__2 TracimTable__hide__md'
    }, props.contentType),

    favoriteButtonColumn({
      header: props.t('Favorite'),
      className: 'TracimTable__styles__width__icon'
    }, props.onFavoriteButtonClick)
  ]

  return (
    <TracimTable
      columns={columns}
      data={props.favoriteList}
      emptyMessage={props.t('You did not add any content as favorite yet.')}
      rowWrapperProps={{ customClass: 'favoriteTable__row' }}
      rowWrapper={ListItemRowWrapper}
      sortable
      filterable
      filterPlaceholder={props.t('Filter my favorites')}
    />
  )
}

FavoritesTable.propsType = {
  favoriteList: PropTypes.array.isRequired,
  onFavoriteButtonClick: PropTypes.func.isRequired
}

const mapStateToProps = ({ contentType }) => ({ contentType })

export default connect(mapStateToProps)(translate()(FavoritesTable))
