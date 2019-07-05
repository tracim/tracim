import React from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import {
  DRAG_AND_DROP
} from '../../helper.js'

const style = {
  borderTop: '1px dashed gray',
  borderBottom: '1px dashed gray',
  padding: '0.5rem 1rem',
  backgroundColor: 'white',
  cursor: 'move'
}

class Field extends React.Component {
  constructor (props) {
    super(props)
    this.ref = React.createRef()
    this.state = {
      editMode: false
    }
    props.connectDropTarget(this.ref)
    props.connectDragSource(this.ref)
  }

  handleChange (event) {
    this.props.onPropertiesChange(event.target.name, event.target.value, this.props.index)
  }

  render () {
    const { isDragging, onDelete, index, name, properties } = this.props
    const opacity = isDragging ? 0 : 1
    return (
      <div style={{ ...style, opacity }} ref={this.ref}>
        <button onClick={() => onDelete(index)}>Delete</button>
        <button onClick={() => this.setState({
          editMode: !this.state.editMode
        })}>Edit</button>
        {name}
        {this.state.editMode && (
          <form>
            <div>
              Titre<br />
              <input type='text' name='title' onChange={this.handleChange.bind(this)} value={properties.title || ''} />
            </div>

            <div>
              Label<br />
              <input type='text' name='label' onChange={this.handleChange.bind(this)} value={properties.label || ''} />
            </div>

            <div>
              Description<br />
              <input type='text' name='description' onChange={this.handleChange.bind(this)} value={properties.description || ''} />
            </div>

            <div>
              Type<br />
              <select name='type' onChange={this.handleChange.bind(this)} value={properties.type || ''}>
                <option value='string'>String</option>
                <option value='integer'>Integer</option>
                <option value='number'>Number</option>
                <option value='boolean'>Boolean</option>
                <option value='array'>Array</option>
              </select>
            </div>

            {properties.type === 'string' && (
              <div>
                Format<br />
                <select name='format' onChange={this.handleChange.bind(this)} value={properties.format || ''}>
                  <option value='' disabled hidden>None</option>
                  <option value='email'>Email</option>
                  <option value='uri'>Uri</option>
                  <option value='data-url'>Data-url</option>
                  <option value='date'>Date</option>
                  <option value='date-time'>Date-time</option>
                </select>
              </div>
            )}
          </form>
        )}
      </div>
    )
  }
}

const fieldDragAndDropSource = {
  beginDrag: props => {
    return {
      index: props.index
    }
  }
}

const fieldDragAndDropSourceCollect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
})

const fieldDragAndDropTarget = {
  hover (props, monitor, component) {
    if (!component) {
      return null
    }
    const node = component.ref.current
    if (!node) {
      return null
    }
    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index
    if (dragIndex === hoverIndex) {
      return
    }
    const hoverBoundingRect = node.getBoundingClientRect()
    const hoverMiddleY =
      (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
    const clientOffset = monitor.getClientOffset()
    const hoverClientY = clientOffset.y - hoverBoundingRect.top
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return
    }
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return
    }
    props.moveCard(dragIndex, hoverIndex)
    monitor.getItem().index = hoverIndex
  }
}

const fieldDragAndDropTargetCollect = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget()
  }
}

export default DragSource(DRAG_AND_DROP.FIELD, fieldDragAndDropSource, fieldDragAndDropSourceCollect)(
  DropTarget(DRAG_AND_DROP.FIELD, fieldDragAndDropTarget, fieldDragAndDropTargetCollect)(Field)
)
