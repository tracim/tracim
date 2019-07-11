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
  addOrderTab
} from './FormBuilder/FormHelper'

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
      }
    }
    this.i = 0
  }

  handleClickSaveButton () {
    let form = this.state
    delete form.editor
    console.log(form)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    // console.log('Update', this.state.schema.properties)
  }

  onSchemaChange = (data) => {
    if (data !== undefined) {
      this.setState({ schema: {type: 'object', properties: data.properties} })
    }
  }

  onUiSchemaChange = (data) => {
    if (data.jsObject !== undefined) {
      this.setState({
        uischema: data.jsObject
      })
    }
  }

  onInfoChange (name, value) {
    this.setState({[name]: value})
  }

  moveField (position, dragIndex, hoverIndex) {
    this.setState({schema: moveField(this.state.schema, position, dragIndex, hoverIndex)})
  }

  removeField (position, label) {
    this.setState({schema: removeField(this.state.schema, position, label)})
  }

  addField (targetType, position, fieldType) {
    this.setState({schema: addField(this.state.schema, targetType, position, fieldType)})
  }

  onPropertiesChange (position, name, value, label) {
    const schema = onPropertiesChange(this.state.schema, position, name, value, label)
    // Check if the onChange got errors, to notify the field
    if (schema === undefined) return false
    this.setState({schema})
  }

  addOrderTab (position) {
    this.setState({schema: addOrderTab(this.state.schema, position)})
  }

  render () {
    return (
      <PageWrapper customClass='adminUser'>
        <PageTitle
          parentClass={'adminUser'}
          title={'Formulaires manager'}
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
                  <th scope='col'>{'Nom du formulaire'}</th>
                </tr>
              </thead>
            </table>
            <div>
              <FormInfo onChange={this.onInfoChange.bind(this)} onSave={this.handleClickSaveButton.bind(this)} />
            </div>

            <br />

            <button onClick={() => this.setState({editor: !this.state.editor})}>{this.state.editor ? 'Drag and drop' : 'Json editor'}</button>
            <div>
              <div className='divLeft'>
                {this.state.editor
                  ? (
                    <JsonFormEditor
                      schema={this.state.schema}
                      onSchemaChange={this.onSchemaChange}
                      onUiSchemaChange={this.onUiSchemaChange}
                    />
                  )
                  : (
                    <FormBuilder
                      schema={this.state.schema}
                      addField={this.addField.bind(this)}
                      removeField={this.removeField.bind(this)}
                      moveField={this.moveField.bind(this)}
                      onPropertiesChange={this.onPropertiesChange.bind(this)}
                      addOrderTab={this.addOrderTab.bind(this)}
                    />
                  )
                }
              </div>

              <div className='divRight'>
                <div>
                  {this.state.schema && (
                    <JsonForm
                      isDisable={false}
                      id={1}
                      customClass={'html-document__editionmode'}
                      disableValidateBtn
                      text={''}
                      schema={this.state.schema}
                      uiSchema={this.state.uischema || {}}
                    />
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
