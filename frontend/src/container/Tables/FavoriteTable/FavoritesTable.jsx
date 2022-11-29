import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { TracimTable } from 'tracim_frontend_lib'
import contentTypeColumn from '../Columns/contentTypeColumn.jsx'
import filenameWithBadgesAndBreadcrumbsColumn from '../Columns/filenameWithBadgesAndBreadcrumbsColumn.jsx'
import timedEventColumn from '../Columns/timedEventColumn.jsx'
import contentInformationColumn from '../Columns/contentInformationColumn.jsx'
import favoriteButtonColumn from '../Columns/favoriteButtonColumn.jsx'
import ListItemRowWrapper from '../RowWrappers/ListItemRowWrapper.jsx'

require('./FavoriteTable.styl')

const FavoritesTable = (props) => {
  const columns = [
    contentTypeColumn(props.t('Type'), props.t, props.contentType),
    filenameWithBadgesAndBreadcrumbsColumn(props.t('Title and path')),
    timedEventColumn(props.t('Last Modification'), props.t),
    contentInformationColumn(props.t('Information'), props.t, props.contentType),
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
