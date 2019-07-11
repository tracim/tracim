import React from 'react'
import FileBase64 from 'react-file-base64'
import PropTypes from 'prop-types'

export class ImageField extends React.Component {
  removeImage () {
    this.props.onChange(undefined)
  }

  getFile (file) {
    this.props.onChange(file.base64)
  }

  render () {
    const p = this.props
    return (
      <div>
        <label
          className='control-label'>{p.schema.title ? p.schema.title : 'title undefined'}</label>
        <div>
          {p.disabled === false && p.formData &&
          <button onClick={this.removeImage.bind(this)}>Changer
            d'image</button>}
          {p.disabled === false && p.formData === undefined && (
            <FileBase64
              multiple={false}
              onDone={this.getFile.bind(this)}
            />
          )}
        </div>
        <div>
          {p.formData && <img src={p.formData} />}
          {p.formData === undefined && <p>Image non défini</p>}
        </div>
      </div>
    )
  }
}

export default ImageField

ImageField.defaultProps = {
  disabled: false
}

ImageField.propTypes = {
  onChange: PropTypes.func,
  schema: PropTypes.object,
  formData: PropTypes.string,
  disabled: PropTypes.bool
}
