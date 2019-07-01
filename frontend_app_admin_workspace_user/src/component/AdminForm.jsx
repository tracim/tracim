import React from 'react'
import JSONInput from 'react-json-editor-ajrm'
import locale from 'react-json-editor-ajrm/locale/en'
import JsonForm from '../../../frontend_app_custom_form/src/component/JsonForm/JsonForm'
import FormComponentDropZone from './FormComponent/FormComponentDropZone.jsx'
import TextFieldDrag from './FormComponent/TextFieldDrag.jsx'

import { translate } from 'react-i18next'
import {
  PageWrapper,
  PageTitle,
  PageContent,
} from 'tracim_frontend_lib'

const uiSchema = {
  resume: {
    'ui:widget': 'textarea'
  },
}

const formData = {
  title: '',

}

export class AdminForm extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      r: false,
      schema: {}
    }
  }

  render () {
    const { props, state } = this

    const onChange = (data) => {

      //console.log(this.state.schema)
      if (data.jsObject !== undefined) {
        this.setState(prevState => ({
          r: true,
          schema: data.jsObject
        }))
      }
    }

    const handleClickSaveButton = e => {
      console.log(this.state.schema)
    }

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
            <table>
              <tbody>
                <tr>
                  <th>
                    <div>
                      <JSONInput
                        id='a_unique_id'
                        locale={locale}
                        height='550px'
                        onChange={onChange}
                      />
                    </div>
                  </th>
                  <th>
                    <div>
                      {this.state.r === true && (<JsonForm
                        isDisable={false}
                        id={1}
                        customClass={'html-document__editionmode'}
                        disableValidateBtn
                        text={''}
                        schema={this.state.schema.schema}
                        uischema={this.state.schema.uischema}
                      />)}
                    </div>
                  </th>
                </tr>
              </tbody>
            </table>
            <button onClick={handleClickSaveButton}>Sauvegarder</button>

            <TextFieldDrag id={0} />
            <FormComponentDropZone />
          </div>
        </PageContent>

      </PageWrapper>

    )
  }
}

export default translate()(AdminForm)
