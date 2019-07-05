import React from 'react'
import JSONInput from 'react-json-editor-ajrm'
import locale from 'react-json-editor-ajrm/locale/fr'
import JsonForm
  from '../../../frontend_app_custom-form/src/component/JsonForm/JsonForm'
import FormBuilder from './FormBuilder/FormBuilder'
import JsonFormEditor from './FormBuilder/JsonFormEditor'

import { translate } from 'react-i18next'
import {
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'
import FormInfo from './FormBuilder/FormInfo'

export class AdminForm extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      editor: true,
      extraInfo: {}
    }
  }

  onSchemaChange = (data) => {
    if (data !== undefined) {
      // TODO WTF is dis
      this.setState({
        schema: {}
      }, () => this.setState({
        schema: data
      }))
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
    this.setState(state => {
      let extraInfo = state.extraInfo
      extraInfo[name] = value
      return {extraInfo}
    })
  }

  handleClickSaveButton () {
    let form = this.state.extraInfo
    form.schema = this.state.schema
    form.uiSchema = this.state.uischema
    console.log(form)
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
                {!this.state.editor && (
                  <FormBuilder onChange={this.onSchemaChange} schema={this.state.schema} />
                )}
                {this.state.editor && (
                  <JsonFormEditor
                    schema={this.state.schema}
                    onSchemaChange={this.onSchemaChange}
                    onUiSchemaChange={this.onUiSchemaChange}
                  />
                  // <div style={{marginTop: '2%'}}>
                  //   <div>
                  //     <p>schema :</p>
                  //     <JSONInput
                  //       id='schema'
                  //       locale={locale}
                  //       height='550px'
                  //       width={'100%'}
                  //       placeholder={this.state.schema}
                  //       onChange={(data) => this.onSchemaChange(data.jsObject)}
                  //     />
                  //   </div>
                  //
                  //   <div>
                  //     <p>uischema :</p>
                  //
                  //     <JSONInput
                  //       id='uischema'
                  //       locale={locale}
                  //       height='250px'
                  //       width={'100%'}
                  //       onChange={this.onUiSchemaChange}
                  //     />
                  //   </div>
                  // </div>
                )}
              </div>

              <div className='divRight'>
                <div>
                  <JsonForm
                    isDisable={false}
                    id={1}
                    customClass={'html-document__editionmode'}
                    disableValidateBtn
                    text={''}
                    schema={this.state.schema || {}}
                    uiSchema={this.state.uischema || {}}
                  />
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
