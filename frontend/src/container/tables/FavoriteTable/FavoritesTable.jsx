import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TracimTable,
  ListItemRowWrapper,
  contentTypeColumn,
  contentFilenameWithBadgesAndBreadcrumbsColumn,
  contentInformationColumn,
  favoriteButtonColumn,
  timedEventColumn
} from 'tracim_frontend_lib'

require('./FavoriteTable.styl')

const FavoritesTable = (props) => {
  const columns = [
    contentTypeColumn({
      header: props.t('Type'),
      tooltip: props.t('Sort by type'),
      className: 'tracimTable__styles__width__icon'
    }, props.contentType),

    contentFilenameWithBadgesAndBreadcrumbsColumn({
      header: props.t('Title and path'),
      tooltip: props.t('Sort by title'),
      className: 'tracimTable__styles__flex__4'
    }),

    timedEventColumn({
      header: props.t('Last Modification'),
      tooltip: props.t('Sort by last modification'),
      className: 'tracimTable__styles__flex__2  tracimTable__hide__md'
    }),

    contentInformationColumn({
      header: props.t('Information'),
      tooltip: props.t('Sort by information'),
      className: 'tracimTable__styles__flex__2 tracimTable__hide__md'
    }, props.contentType),

    favoriteButtonColumn({
      header: props.t('Favorite'),
      className: 'tracimTable__styles__width__icon'
    }, props.onFavoriteButtonClick)
  ]

  return (
    <TracimTable
      columns={columns}
      data={props.favoriteList}
      user={props.user}
      emptyMessage={props.t('You did not add any content as favorite yet.')}
      rowWrapperProps={{
        customClass: 'favoriteTable__row',
        contentType: props.contentType,
        dataCy: 'favorites__item'
      }}
      rowWrapper={ListItemRowWrapper}
      sortable
      filterable
      filterPlaceholder={props.t('Filter my favorites')}
    />
  )
}

FavoritesTable.propsType = {
  favoriteList: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
  onFavoriteButtonClick: PropTypes.func.isRequired
}

const mapStateToProps = ({ contentType, user }) => ({ contentType, user })

export default connect(mapStateToProps)(translate()(FavoritesTable))
