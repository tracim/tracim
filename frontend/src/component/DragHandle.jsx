import React from 'react'
import PropTypes from 'prop-types'

require('./DragHandle.styl')

export const DragHandle = props => (
  <div
    className={`dragHandle ${props.customClass}`}
    title={props.title}
    ref={props.connectDragSource}
    style={props.style}
  >
    <i className='fas fa-arrows' />
  </div>
)

export default DragHandle

DragHandle.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  customClass: PropTypes.string,
  title: PropTypes.string,
  style: PropTypes.object
}

DragHandle.defaultProps = {
  customClass: '',
  title: '',
  style: {}
}
