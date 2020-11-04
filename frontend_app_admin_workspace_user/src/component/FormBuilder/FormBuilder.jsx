import React from 'react'
import FieldList from './FieldsList'
import FieldType from './FieldType'
import PropTypes from 'prop-types'
import {
  FIELD_TYPE,
  POSITION
} from '../../helper.js'

class FormBuilder extends React.Component {
  render () {
    const { schema, addField, removeField, moveField, onPropertiesChange, addOrderTab, uiSchema, changeUiSchema } = this.props
    return (
      <div style={{ marginTop: '2%' }}>
        <div style={{
          float: 'left',
          width: '20%',
          textAlign: 'center'
        }}
        >
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
          <FieldType
            fieldType={FIELD_TYPE.TEXT_RICH.fieldType}
            name={FIELD_TYPE.TEXT_RICH.name}
          />
          <FieldType
            fieldType={FIELD_TYPE.SELECT_USER.fieldType}
            name={FIELD_TYPE.SELECT_USER.name}
          />
          <FieldType
            fieldType={FIELD_TYPE.MARKDOWN_FIELD.fieldType}
            name={FIELD_TYPE.MARKDOWN_FIELD.name}
          />
          <FieldType
            fieldType={FIELD_TYPE.IMAGE_FIELD.fieldType}
            name={FIELD_TYPE.IMAGE_FIELD.name}
          />
        </div>

        <div style={{
          overflow: 'auto',
          width: '80%',
          display: 'inline',
          float: 'right',
          height: '800px',
          border: '1px dashed gray'
        }}
        >
          <FieldList
            schema={schema}
            uiSchema={uiSchema}
            addField={addField}
            removeField={removeField}
            moveField={moveField}
            onPropertiesChange={onPropertiesChange}
            addOrderTab={addOrderTab}
            position={POSITION.ROOT}
            changeUiSchema={changeUiSchema}
          />
        </div>
      </div>
    )
  }
}

export default FormBuilder

FormBuilder.propTypes = {
  schema: PropTypes.object,
  addField: PropTypes.func,
  removeField: PropTypes.func,
  moveField: PropTypes.func,
  onPropertiesChange: PropTypes.func,
  addOrderTab: PropTypes.func,
  position: PropTypes.string,
  changeUiSchema: PropTypes.func
}
