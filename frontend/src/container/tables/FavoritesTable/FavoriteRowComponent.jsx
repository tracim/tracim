import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  tracimTableLib
} from 'tracim_frontend_lib'

const { GenericTracimTableRow, RowWrappers } = tracimTableLib

const FavoriteRowComponent = props => {
  const Wrapper = RowWrappers.ContentRowWrapper
  return (
    <Wrapper
      {...props.rowData.original}
      contentType={props.contentType}
      customClass='favoriteTable__row'
      key={`${props.rowData.id}-wrapper`}
      dataCy='favorites__item'
      read
    >
      <GenericTracimTableRow {...props} />
    </Wrapper>
  )
}

FavoriteRowComponent.propsTypes = {
  rowData: PropTypes.object.isRequired
}

const mapStateToProps = ({ contentType, user }) => ({ contentType, user })

export default connect(mapStateToProps)(FavoriteRowComponent)
