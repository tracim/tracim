import React from 'react'
import Form from 'react-jsonschema-form/lib'
import { translate } from 'react-i18next'
import Radium from 'radium'
const color = require('color')
import field from './CustomFields/index'

export class JsonForm extends React.Component {
  render () {
    const { props } = this

    return (
      <div>
        {props.isDisable && (
          <Form
            disabled={props.isDisable}
            schema={props.schema}
            formData={props.formData}
            uiSchema={props.uiSchema}
            onChange={props.onChange}
            fields={field}
            formContext={props.contextForm}
            noValidate
          >
            <p
              type='submit'
              style={{ display: 'none' }}
            />
          </Form>
        )}
        {props.isDisable === false && (
          <Form
            disabled={props.isDisable}
            schema={props.schema}
            formData={props.formData}
            fields={field}
            uiSchema={props.uiSchema}
            onChange={props.onChange}
            onSubmit={props.onClickValidateBtn}
            formContext={props.contextForm}
            noValidate
          >
            <div
              className={`${props.customClass}__button editionmode__button`}
            >
              <button
                type='button'
                className={`${props.customClass}__cancel editionmode__button__cancel btn outlineTextBtn`}
                onClick={props.onClickCancelBtn}
                style={{
                  backgroundColor: '#fdfdfd',
                  color: props.customColor,
                  borderColor: props.customColor,
                  ':hover': {
                    backgroundColor: props.customColor,
                    color: '#fdfdfd'
                  }
                }}
                key='CustomForm_Validata__cancel'
              >
                {props.t('Cancel')}
              </button>

              <button
                type='submit'
                data-cy='editionmode__button__submit'
                className={`${props.customClass}__submit editionmode__button__submit btn highlightBtn`}
                disabled={props.disableValidateBtn}
                style={{
                  backgroundColor: props.customColor,
                  color: '#fdfdfd',
                  borderColor: props.customColor,
                  ':hover': {
                    backgroundColor: color(props.customColor).darken(0.15).hexString()
                  }
                }}
                key='CustomForm__Validata'
              >
                {props.t('Validate')}
              </button>
            </div>
          </Form>
        )}
      </div>)
  }
}

export default translate()(Radium(JsonForm))
