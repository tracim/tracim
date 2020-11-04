import React from 'react'
// FIXME - CH - 2019-07-08 - JsonForm should not be imported like so.
// Whether to put it into frontend_lib (might be a bit heavy) or to handle it differently
// is yet to be decided
import JsonForm from '../../../frontend_app_custom-form/src/component/JsonForm/JsonForm'
import FormBuilder from './FormBuilder/FormBuilder'
import JsonFormEditor from './FormBuilder/JsonFormEditor'
import { translate } from 'react-i18next'
import {
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'
import FormInfo from './FormBuilder/FormInfo'
import {
  addField,
  moveField,
  removeField,
  onPropertiesChange,
  addOrderTab,
  changeUiSchema,
  addFieldUiSchema,
  removeFieldUiSchema
} from './FormBuilder/FormHelper'
import ErrorBoundary from './FormBuilder/ErrorBoundary'

export class AdminForm extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      editor: true,
      label: '',
      creationLabel: '',
      icon: '',
      color: '',
      schema: {
        type: 'object'
      },
      uischema: {}
    }
  }

  handleClickSaveButton () {
    const form = this.state
    delete form.editor
    console.log(form)
  }

  handleSchemaChange = (data) => {
    if (data !== undefined) {
      this.setState({
        schema: data
      })
    }
  }

  handleUiSchemaChange = (data) => {
    if (data.jsObject !== undefined) {
      this.setState({
        uischema: data.jsObject
      })
    }
  }

  onInfoChange (name, value) {
    this.setState({ [name]: value })
  }

  moveField (position, dragIndex, hoverIndex) {
    this.setState({ schema: moveField(this.state.schema, position, dragIndex, hoverIndex) })
  }

  removeField (position, label) {
    this.setState({
      schema: removeField(this.state.schema, position, label),
      uischema: removeFieldUiSchema(this.state.schema, this.state.uischema, position, label)
    })
  }

  addField (targetType, position, fieldType) {
    const result = addField(this.state.schema, targetType, position, fieldType)
    this.setState({
      schema: result.schemaRoot,
      uischema: addFieldUiSchema(this.state.uischema, targetType, position, result.label, fieldType)
    })
  }

  onPropertiesChange (position, name, value, label) {
    const schema = onPropertiesChange(this.state.schema, position, name, value, label)
    // Check if the onChange got errors, to notify the field
    if (schema === undefined) return false
    this.setState({ schema })
  }

  addOrderTab (position) {
    this.setState({
      schema: addOrderTab(this.state.schema, position)
    })
  }

  changeUiSchema (position, name, value, label) {
    this.setState({
      uischema: changeUiSchema(this.state.schema, this.state.uischema, position, name, value, label)
    })
  }

  render () {
    return (
      <PageWrapper customClass='adminUser'>
        <PageTitle
          parentClass='adminUser'
          title='Formulaires manager'
          icon='users'

        />

        <PageContent parentClass='adminUser'>
          <div className='adminUser__description'>
            {'On this page you can manage the form of your Tracim instance.'}
          </div>

          <div className='adminUser__table'>
            <table className='table'>
              <thead>
                <tr>
                  <th scope='col'>Nom du formulaire</th>
                </tr>
              </thead>
            </table>
            <div>
              <FormInfo onChange={this.onInfoChange.bind(this)} onSave={this.handleClickSaveButton.bind(this)} />
            </div>

            <br />

            <button onClick={() => this.setState({ editor: !this.state.editor })}>{this.state.editor ? 'Drag and drop' : 'Json editor'}</button>
            <div>
              <div className='adminUser__left'>
                {this.state.editor
                  ? (
                    <JsonFormEditor
                      schema={this.state.schema}
                      onSchemaChange={this.handleSchemaChange}
                      onUiSchemaChange={this.handleUiSchemaChange}
                      uiSchema={this.state.uischema}
                    />
                  )
                  : (
                    <FormBuilder
                      schema={this.state.schema}
                      uiSchema={this.state.uischema}
                      addField={this.addField.bind(this)}
                      removeField={this.removeField.bind(this)}
                      moveField={this.moveField.bind(this)}
                      onPropertiesChange={this.onPropertiesChange.bind(this)}
                      addOrderTab={this.addOrderTab.bind(this)}
                      changeUiSchema={this.changeUiSchema.bind(this)}
                    />
                  )}
              </div>

              <div className='adminUser__right'>
                <div>
                  {this.state.schema && (
                    <ErrorBoundary>
                      <JsonForm
                        isDisable={false}
                        id={1}
                        customClass='html-document__editionmode'
                        disableValidateBtn
                        text=''
                        schema={this.state.schema}
                        uiSchema={this.state.uischema || {}}
                      />
                    </ErrorBoundary>
                  )}
                </div>
              </div>
            </div>
          </div>
        </PageContent>

      </PageWrapper>

    )
  }
}

export default translate()(AdminForm)
