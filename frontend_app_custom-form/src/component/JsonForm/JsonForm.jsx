import React from 'react'
import Form from 'react-jsonschema-form/lib'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import field from './CustomFields/index'

export class JsonForm extends React.Component {
  render () {
    return (
      <div>
        {this.props.isDisable && (
          <Form
            disabled={this.props.isDisable}
            schema={this.props.schema}
            formData={this.props.formData}
            uiSchema={this.props.uiSchema}
            onChange={this.props.onChange}
            fields={field}
            formContext={this.props.contextForm}
            noValidate
          >
            <p
              type='submit'
              style={{ display: 'none' }}
            />
          </Form>
        )}
        {this.props.isDisable === false &&
        <Form
          disabled={this.props.isDisable}
          schema={this.props.schema}
          formData={this.props.formData}
          fields={field}
          uiSchema={this.props.uiSchema}
          onChange={this.props.onChange}
          onSubmit={this.props.onClickValidateBtn}
          formContext={this.props.contextForm}
          noValidate
        >
          <div
            className={`${this.props.customClass}__button editionmode__button`}>
            <button
              type='button'
              className={`${this.props.customClass}__cancel editionmode__button__cancel btn outlineTextBtn mr-3`}
              onClick={this.props.onClickCancelBtn}
              style={{
                backgroundColor: '#fdfdfd',
                color: this.props.customColor,
                borderColor: this.props.customColor,
                ':hover': {
                  backgroundColor: this.props.customColor,
                  color: '#fdfdfd'
                }
              }}
              key='CustomForm_Validata__cancel'
            >
              {this.props.t('Cancel')}
            </button>

            <button
              type='submit'
              data-cy='editionmode__button__submit'
              className={`${this.props.customClass}__submit editionmode__button__submit btn highlightBtn`}
              disabled={this.props.disableValidateBtn}
              style={{
                backgroundColor: this.props.customColor,
                color: '#fdfdfd',
                borderColor: this.props.customColor,
                ':hover': {
                  backgroundColor: color(this.props.customColor).darken(0.15).hexString()
                }
              }}
              key='CustomForm__Validata'
            >
              {this.props.t('Validate')}
            </button>
          </div>
        </Form>}
      </div>)
  }
}

export default translate()(Radium(JsonForm))
