import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const NoHoverListItem = props => {
  return (
    <div className='noHoverListItem'>
      {props.children}
    </div>
  )
}

export default NoHoverListItem

NoHoverListItem.propTypes = {
}

NoHoverListItem.defaultProps = {
}
