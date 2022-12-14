import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  tracimTableLib
} from 'tracim_frontend_lib'

require('./FavoritesTable.styl')

const { TracimTable, Columns, RowWrappers } = tracimTableLib

const FavoritesTable = (props) => {
  const columns = [
    Columns.content.contentTypeColumn({
      header: props.t('Type'),
      tooltip: props.t('Sort by type'),
      className: 'tracimTable__styles__width__icon'
    }, props.contentType, props.t),

    Columns.content.contentFilenameWithBadgesAndBreadcrumbsColumn({
      header: props.t('Title and path'),
      tooltip: props.t('Sort by title'),
      className: 'tracimTable__styles__flex__4'
    }, props.t),

    Columns.timedEventColumn({
      header: props.t('Last Modification'),
      tooltip: props.t('Sort by last modification'),
      className: 'tracimTable__styles__flex__2  tracimTable__hide__md'
    }, props.user.lang, props.t),

    Columns.content.contentInformationColumn({
      header: props.t('Information'),
      tooltip: props.t('Sort by information'),
      className: 'tracimTable__styles__flex__2 tracimTable__hide__md'
    }, props.contentType, props.t),

    Columns.favoriteButtonColumn({
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
      rowWrapper={RowWrappers.ListItemRowWrapper}
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

const mapStateToProps = ({ contentType, user }) => ({ contentType, user })

export default connect(mapStateToProps)(translate()(FavoritesTable))
