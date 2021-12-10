import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Checkbox from '../Input/Checkbox.jsx'
import IconButton from '../Button/IconButton.jsx'
import Form from 'react-jsonschema-form-bs4'
import TextareaRich from './TextareaRich.jsx'

require('./CustomFormManager.styl')

const DisplayTitle = props => {
  if (!props.label) return null

  return (
    <div className='DisplayTitle'>
      {props.label}
    </div>
  )
}

const DisplaySchemaPropertyLabel = translate()(props => (
  (props.label && props.label.trim())
    ? (
      <span className='DisplaySchemaPropertyString__label'>
        {props.t('{{label}}: ', { label: props.label, interpolation: { escapeValue: false } })}
      </span>
    )
    : null
))

const DisplaySchemaPropertyString = props => {
  return (
    <div className='DisplaySchemaPropertyString'>
      <DisplaySchemaPropertyLabel {...props} />
      <span
        className='DisplaySchemaPropertyString__value'
        dangerouslySetInnerHTML={{ __html: props.value }}
      />
    </div>
  )
}

const DisplaySchemaPropertyBoolean = props => {
  return (
    <div className='DisplaySchemaPropertyString'>
      <DisplaySchemaPropertyLabel {...props} />
      <span className='DisplaySchemaPropertyString__value'>
        <Checkbox
          name={props.label}
          checked={props.value}
          onClickCheckbox={() => {}}
          styleLabel={{ top: '8px', cursor: 'default' }}
          styleCheck={{ top: '-5px' }}
        />
      </span>
    </div>
  )
}

const DisplaySchemaArray = props => {
  if (!props.valueList) return null

  if (props.valueList.every(value => typeof value === 'string')) {
    return (
      <DisplaySchemaPropertyString
        label={props.label}
        value={props.valueList.join(', ')}
      />
    )
  }

  return [
    <DisplayTitle
      label={props.label}
      key={props.label}
    />,
    props.valueList.map((value, i) => {
      if (!value) return null

      // INFO - CH - 20200126 - The use of the variable valueType is to match the process of DisplaySchemaObject (for consistency)
      // It also will be easier to handle several cases of valueType later if required
      const valueType = typeof value

      if (valueType === 'object') {
        return (
          <div
            className='DisplaySchemaArray'
            key={`object_${props.parentKey}_${value.title}_${i}`}
          >
            <DisplaySchemaObject
              schemaObject={props.schemaObject}
              dataSchemaObject={value}
            />
          </div>
        )
      }

      return null
    })
  ]
}

const orderDataSchema = (dataSchemaObject, uiSchemaObject) => {
  let uiOrderList = uiSchemaObject && uiSchemaObject['ui:order']

  if (!uiOrderList) {
    return Object.entries(dataSchemaObject)
  }

  if (!uiOrderList.includes('*')) {
    uiOrderList = [...uiOrderList, '*']
  }

  const orderedDataSchema = []

  for (const uiKey of uiOrderList) {
    const schemaItem = dataSchemaObject[uiKey]
    if (schemaItem) {
      orderedDataSchema.push([uiKey, schemaItem])
    } else if (uiKey === '*') {
      for (const dataKey of Object.keys(dataSchemaObject)) {
        if (!uiOrderList.includes(dataKey)) {
          orderedDataSchema.push([dataKey, dataSchemaObject[dataKey]])
        }
      }
    }
  }

  return orderedDataSchema
}

const DisplaySchemaObject = props => {
  if (!props.dataSchemaObject || !props.schemaObject) {
    console.error('Error in DisplaySchemaObject, null props', props)
    return null
  }

  const title = props.schemaObject.title
    ? (
      <DisplayTitle
        label={props.schemaObject.title}
        key={props.schemaObject.title}
      />
    )
    : null

  const orderedDataSchema = orderDataSchema(props.dataSchemaObject, props.uiSchemaObject)

  return [
    title,
    <div className='DisplaySchemaObject' key={`object_root_${props.nestedLevel}`}>
      {orderedDataSchema.map(([key, value]) => {
        const schemaItemProperties = props.schemaObject.properties[key]
        if (!schemaItemProperties) {
          console.error(`Key ${key} is missing in the JSON schema object`)
          return <div>Error loading field {key}</div>
        }

        const valueType = typeof value

        if (Array.isArray(value)) {
          return (
            <DisplaySchemaArray
              label={schemaItemProperties.title}
              valueList={value}
              parentKey={key}
              schemaObject={schemaItemProperties.items}
              key={`array_${key}`}
            />
          )
        }

        if (valueType === 'object') {
          return (
            <DisplaySchemaObject
              schemaObject={schemaItemProperties}
              dataSchemaObject={value}
              nestedLevel={props.nestedLevel + 1}
              key={`object_${key}`}
            />
          )
        }

        if (valueType === 'string') {
          return (
            <DisplaySchemaPropertyString
              label={schemaItemProperties.title}
              value={value}
              key={`property_string_${key}`}
            />
          )
        }

        if (valueType === 'boolean') {
          return (
            <DisplaySchemaPropertyBoolean
              label={schemaItemProperties.title}
              value={value}
              key={`property_boolean_${key}_${value}`}
            />
          )
        }

        return null
      })}
    </div>
  ]
}

const SchemaAsView = props => {
  return (
    <div className='SchemaAsView'>
      <DisplaySchemaObject
        schemaObject={props.schemaObject}
        uiSchemaObject={props.uiSchemaObject}
        dataSchemaObject={props.dataSchemaObject}
        nestedLevel={1}
      />

      {props.displayEditButton && (
        <IconButton
          customClass={props.submitButtonClass}
          icon='fas fa-edit'
          onClick={props.onClickToggleButton}
          text={props.validateLabel}
          dataCy='CustomFormManager__edit__button'
        />
      )}
    </div>
  )
}

const TextRichWidget = connect(({ user }) => ({ user }))(props => {
  return (
    <TextareaRich
      onChangeText={props.onChange}
      initializationLanguage={props.user.lang}
      {...props}
    />
  )
})

class SchemaAsForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      // CH - INFO - 20210128 - we need to copy the props because <Form /> needs to be used as a controlled component
      // see https://github.com/tracim/tracim/issues/4105
      dataSchema: props.dataSchemaObject
    }
  }

  handleChangeDataSchema = ({ formData }) => {
    this.setState({ dataSchema: formData })
  }

  render () {
    const { props, state } = this
    return (
      <Form
        schema={props.schemaObject}
        uiSchema={props.uiSchemaObject}
        formData={state.dataSchema}
        widgets={{
          TextareaWidget: TextRichWidget
        }}
        onChange={this.handleChangeDataSchema}
        onSubmit={(formData, e) => {
          props.onClickToggleButton()
          props.onSubmitDataSchema(formData, e)
        }}
      >
        <IconButton
          customClass={props.submitButtonClass}
          icon='fas fa-check'
          type='submit'
          text={props.validateLabel}
        />
      </Form>
    )
  }
}

const MODE = {
  VIEW: 'view',
  EDIT: 'edit'
}

export class CustomFormManager extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      mode: MODE.VIEW
    }
  }

  handleClickToggleMode = () => {
    const { state } = this
    if (state.mode === MODE.VIEW) {
      this.setState({ mode: MODE.EDIT })
      return
    }

    if (state.mode === MODE.EDIT) {
      this.setState({ mode: MODE.VIEW })
    }
  }

  render () {
    const { props, state } = this

    return (
      <div className='CustomFormManager'>
        <div className='CustomFormManager__title'>{props.title}</div>

        {(state.mode === MODE.VIEW
          ? (
            <SchemaAsView
              schemaObject={props.schemaObject}
              uiSchemaObject={props.uiSchemaObject}
              dataSchemaObject={props.dataSchemaObject}
              validateLabel={props.t('Edit')}
              submitButtonClass={props.submitButtonClass}
              displayEditButton={props.displayEditButton}
              onClickToggleButton={this.handleClickToggleMode}
            />
          )
          : (
            <SchemaAsForm
              schemaObject={props.schemaObject}
              uiSchemaObject={props.uiSchemaObject}
              dataSchemaObject={props.dataSchemaObject}
              onSubmitDataSchema={props.onSubmitDataSchema}
              validateLabel={props.t('Validate')}
              submitButtonClass={props.submitButtonClass}
              onClickToggleButton={this.handleClickToggleMode}
            />
          )
        )}
      </div>
    )
  }
}

export default translate()(CustomFormManager)

CustomFormManager.propTypes = {
  title: PropTypes.string,
  schemaObject: PropTypes.object,
  uiSchemaObject: PropTypes.object,
  dataSchemaObject: PropTypes.object,
  displayEditButton: PropTypes.bool,
  onSubmitDataSchema: PropTypes.func
}

CustomFormManager.defaultProps = {
  title: '',
  schemaObject: {},
  uiSchemaObject: {},
  dataSchemaObject: {},
  displayEditButton: false,
  onSubmitDataSchema: () => {}
}
