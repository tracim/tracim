import React from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import PropTypes from 'prop-types'
import FieldsList from './FieldsList'
import {
  DRAG_AND_DROP,
  getFormats,
  getWidgets
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
    this.props.onPropertiesChange(this.props.position, event.target.name, event.target.value, this.props.properties.label)
  }

  onLabelChange () {
    const newLabel = prompt('Please enter a new label', this.props.properties.label)
    if (newLabel !== null && newLabel !== '') {
      if (this.props.onPropertiesChange(this.props.position, 'label', newLabel, this.props.properties.label) === false) {
        alert('Invalid Label')
      }
    }
  }

  renderFormat (type, i) {
    return (<option value={type} key={i}>{type}</option>)
  }

  render () {
    const { isDragging, removeField, index, name, properties, onPropertiesChange, position, addField, moveField, addOrderTab, changeUiSchema, uiSchema } = this.props
    const opacity = isDragging ? 0 : 1
    return (
      <div style={{ ...style, opacity }}>
        <div ref={this.ref}>
          <button onClick={() => removeField(position, properties.label)}>Delete</button>
          <button onClick={() => this.setState({
            editMode: !this.state.editMode
          })}
          >Edit
          </button>
          {name}
        </div>
        {this.state.editMode && (
          <div className='fieldInfo'>
            <div>
              Titre<br />
              <input type='text' name='title' onChange={this.handleChange.bind(this)} value={properties.title || ''} />
            </div>

            <div>
              Description<br />
              <textarea type='text' name='description' onChange={this.handleChange.bind(this)} value={properties.description || ''} />
            </div>

            <div>
              Label<br />
              {/* <input type='text' name='label' onChange={this.handleChange.bind(this)} value={properties.label || ''} /> */}
              <button onClick={this.onLabelChange.bind(this)}>Change it</button>
            </div>

            <div>
              Required
              <input type='checkbox' name='required' onChange={event => onPropertiesChange(this.props.position, event.target.name, event.target.checked, this.props.properties.label)} checked={properties.require || false} />
            </div>

            {/* <div> */}
            {/*   Type<br /> */}
            {/*   <select name='type' onChange={this.handleChange.bind(this)} value={properties.type || ''}> */}
            {/*     <option value='string'>String</option> */}
            {/*     <option value='integer'>Integer</option> */}
            {/*     <option value='number'>Number</option> */}
            {/*     <option value='boolean'>Boolean</option> */}
            {/*     <option value='array'>Array</option> */}
            {/*     <option value='object'>Object</option> */}
            {/*   </select> */}
            {/* </div> */}

            {getFormats(properties.type) && (
              <div>
                Format<br />
                <select name='format' onChange={this.handleChange.bind(this)} value={properties.format || ''}>
                  <option value=''>none</option>
                  {getFormats(properties.type).map((format, i) => this.renderFormat(format, i))}
                </select>
              </div>
            )}

            {getWidgets(properties.type) && (
              <div>
                Widget<br />
                <select name='widget' onChange={(event) => changeUiSchema(this.props.position, 'ui:widget', event.target.value, properties.label)} value={properties.uiSchema ? properties.uiSchema['ui:widget'] ? properties.uiSchema['ui:widget'] : '' : ''}>
                  <option value=''>None</option>
                  {getWidgets(properties.type).map((format, i) => this.renderFormat(format, i))}
                </select>
              </div>
            )}

            {properties.type === 'array' && (
              <div>
                Items type :<br />
                <div style={{
                  overflow: 'auto',
                  width: '100%',
                  height: '200px',
                  border: '2px dashed gray'
                }}
                >
                  <FieldsList
                    schema={properties}
                    onChange={(schema) => {
                      onPropertiesChange('items', schema, index)
                    }}
                    addField={addField}
                    position={properties.label}
                    removeField={removeField}
                    moveField={moveField}
                    onPropertiesChange={onPropertiesChange}
                    addOrderTab={addOrderTab}
                    changeUiSchema={changeUiSchema}
                    uiSchema={uiSchema}
                  />
                </div>
              </div>
            )}

            {properties.type === 'object' && (
              <div>
                Object<br />
                <div style={{
                  overflow: 'auto',
                  width: '100%',
                  height: '200px',
                  border: '2px dashed gray'
                }}
                >
                  <FieldsList
                    schema={properties}
                    onChange={(schema) => {
                      onPropertiesChange('properties', schema.properties, index)
                    }}
                    addField={addField}
                    position={properties.label}
                    removeField={removeField}
                    moveField={moveField}
                    onPropertiesChange={onPropertiesChange}
                    addOrderTab={addOrderTab}
                    changeUiSchema={changeUiSchema}
                    uiSchema={uiSchema}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}

const fieldDragAndDropSource = {
  beginDrag: (props, monitor, component) => {
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
    // console.log(dragIndex, hoverIndex)
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
    props.moveField(props.position, dragIndex, hoverIndex)
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

Field.propTypes = {
  index: PropTypes.number,
  id: PropTypes.string,
  name: PropTypes.string,
  properties: PropTypes.object,
  moveField: PropTypes.func,
  removeField: PropTypes.func,
  onPropertiesChange: PropTypes.func,
  position: PropTypes.string,
  addField: PropTypes.func,
  addOrderTab: PropTypes.func,
  changeUiSchema: PropTypes.func,
  uiSchema: PropTypes.object
}
