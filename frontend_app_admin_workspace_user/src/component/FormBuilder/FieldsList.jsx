import React from 'react'
import Field from './Field'
import { DropTarget } from 'react-dnd'
import {
  DRAG_AND_DROP
} from '../../helper.js'
const style = {
  width: '100%',
  height: '400px',
  border: '1px dashed gray'
}

class FieldsList extends React.Component {
  constructor (props) {
    super(props)
    this.i = 0
    this.state = {
      fields: props.schema ? Object.keys(props.schema.properties).map(key => {
        let properties = props.schema.properties[key]
        properties.label = props.schema.properties.label || key
        return {
          id: this.i++,
          properties: properties
        }
      }) : [],
      schema: props.schema || {}
    }
  }

  handleSchemaChange () {
    const fields = this.state.fields || []
    this.setState(state => {
      let properties = {}
      state.fields.forEach((field, index) => {
        let add = ''
        let count = 0
        fields.forEach((f) => {
          if (f.properties.label === field.properties.label) {
            count++
          }
        })
        if (count > 1) add = '2'
        field.properties.label += add
        properties[field.properties.label + add] = field.properties
      })
      return {
        schema: {type: 'object', properties: properties}
      }
    }, () => this.props.onChange(this.state.schema))
  }

  onDelete (index) {
    this.setState(state => {
      let fields = state.fields
      fields.splice(index, 1)
      return {
        fields
      }
    }, () => this.handleSchemaChange())
  }

  onPropertiesChange (name, value, index) {
    this.setState(state => {
      let fields = state.fields
      fields[index].properties[name] = value
      return {
        fields
      }
    }, () => this.handleSchemaChange())
  }

  renderField (field, index) {
    return (
      <Field
        key={field.id}
        index={index}
        id={field.id}
        moveCard={this.moveCard}
        name={field.properties.label + ' : ' + field.properties.type}
        onDelete={this.onDelete.bind(this)}
        properties={field.properties}
        onPropertiesChange={this.onPropertiesChange.bind(this)}
      />
    )
  }

  moveCard = (dragIndex, hoverIndex) => {
    if (dragIndex !== undefined && hoverIndex !== undefined) {
      this.setState(state => {
        const dragField = state.fields[dragIndex]
        let fields = state.fields
        fields[dragIndex] = fields[hoverIndex]
        fields[hoverIndex] = dragField
        return {
          fields
        }
      }, () => this.handleSchemaChange())
      return true
    } else {
      return false
    }
  }
  render () {
    const fields = this.state.fields
    return (
      <div style={{ ...style }} ref={this.props.connectDropTarget}>
        <div>{fields.map((field, i) => this.renderField(field, i))}</div>
      </div>
    )
  }
}

const fieldsListDragAndDropTarget = {
  drop: (props, monitor, component) => {
    const fieldType = monitor.getItem()
    component.setState(state => {
      const fields = state.fields.concat({
        id: component.i,
        properties: {
          type: fieldType.fieldType,
          label: 'f_' + component.i++
        }
      })
      return {
        fields
      }
    }, () => component.handleSchemaChange())
  }
}

const fieldsListDragAndDropSourceCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget()
})

export default DropTarget(DRAG_AND_DROP.FIELD_TYPE, fieldsListDragAndDropTarget, fieldsListDragAndDropSourceCollect)(FieldsList)
