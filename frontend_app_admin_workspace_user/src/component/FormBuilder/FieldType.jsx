import React from 'react'
import { DragSource } from 'react-dnd'
import { DRAG_AND_DROP } from '../../helper'
import PropTypes from 'prop-types'
const style = {
  border: '1px dashed gray',
  backgroundColor: 'white',
  padding: '0.5rem 1rem',
  marginInlineEnd: '1.5rem',
  marginBottom: '1.5rem',
  cursor: 'move'
}

class FieldType extends React.Component {
  render () {
    const { props } = this

    const opacity = props.isDragging ? 0.4 : 1
    return (
      <div ref={props.connectDragSource} style={{ ...style, opacity }}>
        {props.name}
      </div>
    )
  }
}

const fieldTypeDragAndDropSource = {
  beginDrag: props => {
    return {
      fieldType: props.fieldType
    }
  }
}

const fieldTypeDragAndDropSourceCollect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
})

export default DragSource(DRAG_AND_DROP.FIELD_TYPE, fieldTypeDragAndDropSource, fieldTypeDragAndDropSourceCollect)(FieldType)

FieldType.propTypes = {
  fieldType: PropTypes.string,
  name: PropTypes.string
}
