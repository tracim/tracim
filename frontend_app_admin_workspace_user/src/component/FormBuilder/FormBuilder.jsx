import React from 'react'
import FieldList from './FieldsList'
import FieldType from './FieldType'
import PropTypes from 'prop-types'
import {
  FIELD_TYPE,
  POSITION } from '../../helper'

class FormBuilder extends React.Component {
  render () {
    const { schema, addField, removeField, moveField, onPropertiesChange, addOrderTab } = this.props
    return (
      <div style={{marginTop: '2%'}}>
        <div style={{
          float: 'left',
          width: '17%',
          textAlign: 'center'
        }}>
          <FieldType
            fieldType={FIELD_TYPE.STRING.fieldType}
            name={FIELD_TYPE.STRING.name}
          />
          <FieldType
            fieldType={FIELD_TYPE.INTEGER.fieldType}
            name={FIELD_TYPE.INTEGER.name}
          />
          <FieldType
            fieldType={FIELD_TYPE.NUMBER.fieldType}
            name={FIELD_TYPE.NUMBER.name}
          />
          <FieldType
            fieldType={FIELD_TYPE.BOOLEAN.fieldType}
            name={FIELD_TYPE.BOOLEAN.name}
          />
          <FieldType
            fieldType={FIELD_TYPE.ARRAY.fieldType}
            name={FIELD_TYPE.ARRAY.name}
          />
          <FieldType
            fieldType={FIELD_TYPE.OBJECT.fieldType}
            name={FIELD_TYPE.OBJECT.name}
          />
        </div>

        <div style={{
          overflow: 'auto',
          width: '83%',
          display: 'inline',
          float: 'right',
          height: '800px',
          border: '1px dashed gray'
        }}>
          <FieldList
            schema={schema}
            addField={addField}
            removeField={removeField}
            moveField={moveField}
            onPropertiesChange={onPropertiesChange}
            addOrderTab={addOrderTab}
            position={POSITION.ROOT}
          />
        </div>
      </div>
    )
  }
}

export default FormBuilder

FormBuilder.propTypes = {
  schema: PropTypes.object
}
