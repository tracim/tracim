import React from 'react'
import PropTypes from 'prop-types'

require('./DragHandle.styl')

export const DragHandle = props => (
  <div
    className={`dragHandle ${props.customClass}`}
    ref={props.connectDragSource}
  >
    <i className='fa fa-ellipsis-v' />
  </div>
)

export default DragHandle

DragHandle.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  customClass: PropTypes.string
}

DragHandle.defaultProps = {
  customClass: ''
}
