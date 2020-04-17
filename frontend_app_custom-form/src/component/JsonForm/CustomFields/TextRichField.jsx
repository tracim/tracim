import React from 'react'
import { Editor } from '@tinymce/tinymce-react'
import PropTypes from 'prop-types'

export class TextRichField extends React.Component {
  render () {
    const { props } = this
    return (
      <div>
        <label
          className='control-label'>{props.schema.title ? props.schema.title : 'title undefined'}
        </label>
        {props.disabled && <div className='custom-form__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: props.formData}} />}
        {!props.disabled && <Editor
          onChange={(v) => props.onChange(v.target.getContent(), props.id)}
          menubar={false}
          disabled={props.disabled}
          value={props.formData ? props.formData : ''}
          init={{
            menubar: false
          }}
          toolbar=''
        />}
      </div>
    )
  }
}

export default TextRichField

TextRichField.defaultProps = {
  disabled: false
}

TextRichField.propType = {
  onChange: PropTypes.func,
  schema: PropTypes.object,
  formData: PropTypes.object,
  disabled: PropTypes.bool
}
