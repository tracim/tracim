import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import FavoriteRowComponent from './FavoriteRowComponent.jsx'

import {
  tracimTableLib
} from 'tracim_frontend_lib'

require('./FavoritesTable.styl')

const { TracimTable, Columns, STYLE } = tracimTableLib

const FavoritesTable = (props) => {
  const columns = [
    Columns.content.contentTypeColumn({
      header: props.t('Type'),
      tooltip: props.t('Sort by type'),
      style: [STYLE.layout.iconWidthCentered],
      id: 'type'
    }, props.contentType, props.t),

    Columns.content.contentFilenameWithBadgesAndBreadcrumbsColumn({
      header: props.t('Title and path'),
      tooltip: props.t('Sort by title'),
      style: [STYLE.layout.flex4],
      id: 'titleWithPath'
    }, props.t),

    Columns.timedEventColumn({
      header: props.t('Last Modification'),
      tooltip: props.t('Sort by last modification'),
      style: [STYLE.layout.flex2, STYLE.hiddenAt.md],
      id: 'lastModification'
    }, props.user.lang, props.t),

    Columns.content.contentStatusColumn({
      header: props.t('Information'),
      tooltip: props.t('Sort by information'),
      style: [STYLE.layout.flex2, STYLE.hiddenAt.md],
      id: 'information'
    }, props.contentType, props.t),

    Columns.favoriteButtonColumn({
      header: props.t('Favorite'),
      style: [STYLE.layout.iconWidthCentered],
      id: 'favoriteButton'
    }, props.onFavoriteButtonClick)
  ]

  return (
    <TracimTable
      columns={columns}
      data={props.favoriteList}
      emptyMessage={props.t('You did not add any content as favorite yet.')}
      rowComponent={FavoriteRowComponent}
      sortable
      filterable
      filterPlaceholder={props.t('Filter my favorites')}
      defaultSortColumnId='titleWithPath'
    />
  )
}

FavoritesTable.propsType = {
  favoriteList: PropTypes.array.isRequired,
  onFavoriteButtonClick: PropTypes.func.isRequired
}

const mapStateToProps = ({ contentType, user }) => ({ contentType, user })

export default connect(mapStateToProps)(translate()(FavoritesTable))
