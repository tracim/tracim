import React from 'react'
import { Editor } from '@tinymce/tinymce-react'
import PropTypes from 'prop-types'

export class TextRichField extends React.Component {
  render () {
    const p = this.props
    return (
      <div>
        <label
          className='control-label'>{p.schema.title ? p.schema.title : 'title undefined'}
        </label>
        {p.disabled && <div className='custom-form__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: p.formData}} />}
        {!p.disabled && <Editor
          onChange={(v) => p.onChange(v.target.getContent(), p.id)}
          menubar={false}
          disabled={p.disabled}
          value={p.formData ? p.formData : ''}
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
