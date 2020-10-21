import React from 'react'
import Field from './Field'
import { DropTarget } from 'react-dnd'
import {
  DRAG_AND_DROP
} from '../../helper.js'
import PropTypes from 'prop-types'
import {
  findFieldInUiSchema
} from './FormHelper'

const style = {
  width: '100%',
  height: '100%'
}

class FieldsList extends React.Component {
  constructor (props) {
    super(props)
    this.ref = React.createRef()
  }

  renderField (field, index) {
    return (
      <Field
        key={field.label}
        index={index}
        id={field.label}
        moveField={this.props.moveField}
        name={field.label + ' : ' + field.type}
        removeField={this.props.removeField}
        properties={field}
        onPropertiesChange={this.props.onPropertiesChange}
        position={this.props.position}
        addField={this.props.addField}
        addOrderTab={this.props.addOrderTab}
        changeUiSchema={this.props.changeUiSchema}
        uiSchema={this.props.uiSchema}
      />
    )
  }

  addField (fieldType) {
    const targetType = this.props.schema.type
    this.props.addField(targetType, this.props.position, fieldType.fieldType)
  }

  getFieldsFromArray () {
    const schema = Object.assign({}, this.props.schema)
    const uiSchema = Object.assign({}, this.props.uiSchema)
    if (schema.items === undefined) return []
    if (schema.items.type && schema.items.type === 'object') {
      if (schema.items.order) {
        return schema.items.order.map(p => ({
          ...schema.items.properties[p],
          label: p,
          require: schema.items.required ? schema.items.required.includes(p) : false,
          uiSchema: uiSchema ? findFieldInUiSchema(uiSchema, p) : undefined
        }))
      }
      this.props.addOrderTab(this.props.position)
    }
    return [{ ...schema.items, label: 'unique' }]
  }

  getFieldsFromObject () {
    const schema = Object.assign({}, this.props.schema)
    const uiSchema = Object.assign({}, this.props.uiSchema)
    if (schema.properties === undefined) return []
    if (schema.order) {
      return schema.order.map(p => ({
        ...schema.properties[p],
        label: p,
        require: schema.required ? schema.required.includes(p) : false,
        uiSchema: uiSchema ? findFieldInUiSchema(uiSchema, p) : undefined
      }))
    }
    this.props.addOrderTab(this.props.position)
    return []
  }

  getFields () {
    if (this.props.schema.type === 'object') {
      return this.getFieldsFromObject()
    } else {
      return this.getFieldsFromArray()
    }
  }

  render () {
    const fields = this.getFields()
    return (
      <div style={{ ...style }} ref={this.props.connectDropTarget}>
        <div>{fields.map((field, i) => this.renderField(field, i))}</div>
      </div>
    )
  }
}

const fieldsListDragAndDropTarget = {
  drop: (props, monitor, component) => {
    if (monitor.didDrop()) return
    component.addField(monitor.getItem())
  }
}

const fieldsListDragAndDropSourceCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget()
})

export default DropTarget(DRAG_AND_DROP.FIELD_TYPE, fieldsListDragAndDropTarget, fieldsListDragAndDropSourceCollect)(FieldsList)

FieldsList.propTypes = {
  schema: PropTypes.object,
  addField: PropTypes.func,
  removeField: PropTypes.func,
  moveField: PropTypes.func,
  onPropertiesChange: PropTypes.func,
  addOrderTab: PropTypes.func,
  position: PropTypes.string,
  changeUiSchema: PropTypes.func
}

FieldsList.defaultProps = {
  schema: {}
}
