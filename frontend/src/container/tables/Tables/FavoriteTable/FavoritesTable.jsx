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
    contentTypeColumn(props.t('Type'), props.t('Sort by type'), props.contentType),
    contentFilenameWithBadgesAndBreadcrumbsColumn(props.t('Title and path'), props.t('Sort by title')),
    timedEventColumn(props.t('Last Modification'), props.t('Sort by last modification')),
    contentInformationColumn(props.t('Information'), props.t('Sort by information'), props.contentType),
    favoriteButtonColumn(props.t('Favorite'), props.onFavoriteButtonClick)
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
