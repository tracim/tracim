import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  tracimTableLib
} from 'tracim_frontend_lib'

const { GenericTracimTableLine, RowWrappers } = tracimTableLib

const FavoriteLineComponent = props => {
  const Wrapper = RowWrappers.ListItemRowWrapper
  return (
    <Wrapper
      customClass='favoriteTable__row'
      contentType={props.contentType}
      {...props.rowData.original}
      key={`${props.rowData.id}-wrapper`}
      dataCy='favorites__item'
    >
      <GenericTracimTableLine {...props} />
    </Wrapper>
  )
}

FavoriteLineComponent.propsTypes = {
  rowData: PropTypes.object.isRequired
}

const mapStateToProps = ({ contentType, user }) => ({ contentType, user })

export default connect(mapStateToProps)(FavoriteLineComponent)
