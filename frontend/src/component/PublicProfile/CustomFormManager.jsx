import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { IconButton } from 'tracim_frontend_lib'
import Form from '@rjsf/core'

const SchemaAsView = props => {
  if (!props.schemaObject.properties) return null
  return (
    <div>
      {Object.entries(props.schemaObject.properties).map(([key, val]) => {
        return (
          <div key={`viewInfoCustomProp_${key}`}>
            <span>{val.title}</span><span>{props.dataSchemaObject[key]}</span>
          </div>
        )
      })}
    </div>
  )
}

const SchemaAsForm = props => {
  return (
    <Form
      schema={props.schemaObject}
      uiSchema={props.uiSchemaObject}
      formData={props.dataSchemaObject}
      onChange={props.onChangeDataSchema}
    />
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
      <div>
        <div>{props.title}</div>

        {(state.mode === MODE.VIEW
          ? (
            <IconButton
              customClass=''
              icon='pencil-square-o'
              onClick={this.handleClickToggleMode}
              text={props.t('Edit')}
            />
          )
          : (
            <IconButton
              customClass=''
              icon='check'
              onClick={this.handleClickToggleMode}
              text={props.t('Validate')}
            />
          )
        )}

        {(state.mode === MODE.VIEW
          ? (
            <SchemaAsView
              schemaObject={props.schemaObject}
              dataSchemaObject={props.dataSchemaObject}
            />
          )
          : (
            <SchemaAsForm
              schemaObject={props.schemaObject}
              uiSchemaObject={props.uiSchemaObject}
              dataSchemaObject={props.dataSchemaObject}
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
  onChangeDataSchema: PropTypes.func
}

CustomFormManager.defaultProps = {
  title: '',
  schemaObject: {},
  uiSchemaObject: {},
  dataSchemaObject: {},
  onChangeDataSchema: () => {}
}
