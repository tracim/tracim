import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { IconButton } from 'tracim_frontend_lib'
// import Form from '@rjsf/core'
import Form from 'react-jsonschema-form-bs4'

require('./CustomFormManager.styl')

const DisplaySchemaProperty = props => {
  return (
    <div
      className='DisplaySchemaProperty'
    >
      <span
        className={classnames(
          'DisplaySchemaProperty__label',
          { noLabel: !props.label }
        )}
      >
        {props.label}
      </span>
      <span className='DisplaySchemaProperty__value'>{props.value}</span>
    </div>
  )
}

const DisplaySchemaObject = props => {
  // if (props.schema.hasOwnProperty('properties')) {
  //   return (
  //     <>
  //       <div className='title'>{props.schema.title}</div>
  //       <DisplaySchemaObject schema={props.schema.properties} />
  //     </>
  //   )
  // }
  if (!props.schemaObject.properties) return null

  return (
    Object.entries(props.schemaObject.properties).map(([key, val]) => {
      return (
        <DisplaySchemaProperty
          label={val.title}
          value={props.dataSchemaObject[key]}
          key={`schemaField_${key}`}
        />
      )
    })
  )
}

const SchemaAsView = props => {
  return (
    <div className='SchemaAsView'>
      <DisplaySchemaObject
        schemaObject={props.schemaObject}
        dataSchemaObject={props.dataSchemaObject}
      />

      <IconButton
        customClass={props.submitButtonClass}
        icon='pencil-square-o'
        onClick={props.onClickToggleButton}
        text={props.validateLabel}
      />
    </div>
  )
}

const SchemaAsForm = props => {
  return (
    <Form
      schema={props.schemaObject}
      uiSchema={props.uiSchemaObject}
      formData={props.dataSchemaObject}
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
      mode: MODE.EDIT
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
      <div style={{ position: 'relative' }}>
        <div>{props.title}</div>

        {(state.mode === MODE.VIEW
          ? (
            <SchemaAsView
              schemaObject={props.schemaObject}
              dataSchemaObject={props.dataSchemaObject}
              validateLabel={props.t('Edit')}
              submitButtonClass={props.submitButtonClass}
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
  onSubmitDataSchema: PropTypes.func
}

CustomFormManager.defaultProps = {
  title: '',
  schemaObject: {},
  uiSchemaObject: {},
  dataSchemaObject: {},
  onSubmitDataSchema: () => {}
}
