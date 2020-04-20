import React from 'react'
import FileBase64 from 'react-file-base64'
import PropTypes from 'prop-types'

export class ImageField extends React.Component {
  removeImage = () => {
    this.props.onChange(undefined)
  }

  getFile = (file) => {
    this.props.onChange(file.base64)
  }

  render () {
    const { props } = this
    return (
      <div>
        <label
          className='control-label'>{props.schema.title ? props.schema.title : 'title undefined'}</label>
        <div>
          {props.disabled === false && props.formData &&
          <button onClick={this.removeImage}>Changer
            d'image</button>}
          {props.disabled === false && props.formData === undefined && (
            <FileBase64
              multiple={false}
              onDone={this.getFile}
            />
          )}
        </div>
        <div>
          {props.formData && <img src={props.formData} />}
          {props.formData === undefined && <p>Image non défini</p>}
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
