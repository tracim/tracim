import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { IconButton, Checkbox } from 'tracim_frontend_lib'
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

const DisplaySchemaPropertyString = props => {
  return (
    <div className='DisplaySchemaPropertyString'>
      <span
        className={classnames(
          'DisplaySchemaPropertyString__label',
          { noLabel: !props.label }
        )}
      >
        {props.label}
      </span>
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
      <span
        className={classnames(
          'DisplaySchemaPropertyString__label',
          { noLabel: !props.label }
        )}
      >
        {props.label}
      </span>
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

  return [
    title,
    <div className='DisplaySchemaObject' key={`object_root_${props.nestedLevel}`}>
      {Object.entries(props.dataSchemaObject).map(([key, value]) => {
        const valueType = typeof value

        if (Array.isArray(value)) {
          return (
            <DisplaySchemaArray
              label={props.schemaObject.properties[key].title}
              valueList={value}
              parentKey={key}
              schemaObject={props.schemaObject.properties[key].items}
              key={`array_${key}`}
            />
          )
        }

        if (valueType === 'object') {
          return (
            <DisplaySchemaObject
              schemaObject={props.schemaObject.properties[key]}
              dataSchemaObject={value}
              nestedLevel={props.nestedLevel + 1}
              key={`object_${key}`}
            />
          )
        }

        if (valueType === 'string') {
          return (
            <DisplaySchemaPropertyString
              label={props.schemaObject.properties[key].title}
              value={value}
              key={`property_string_${key}`}
            />
          )
        }

        if (valueType === 'boolean') {
          return (
            <DisplaySchemaPropertyBoolean
              label={props.schemaObject.properties[key].title}
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
        dataSchemaObject={props.dataSchemaObject}
        nestedLevel={1}
      />

      {props.displayEditButton && (
        <IconButton
          customClass={props.submitButtonClass}
          icon='pencil-square-o'
          onClick={props.onClickToggleButton}
          text={props.validateLabel}
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

const SchemaAsForm = props => {
  return (
    <Form
      schema={props.schemaObject}
      uiSchema={props.uiSchemaObject}
      formData={props.dataSchemaObject}
      widgets={{
        TextareaWidget: TextRichWidget
      }}
      onSubmit={(formData, e) => {
        props.onClickToggleButton()
        props.onSubmitDataSchema(formData, e)
      }}
    >
      <IconButton
        customClass={props.submitButtonClass}
        icon='check'
        type='submit'
        text={props.validateLabel}
      />
    </Form>
  )
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
