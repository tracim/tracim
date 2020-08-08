import React from 'react'
// INFO - GM - 2020/04/24 - this lib is old and we should find a better way to upload file and convert it in base64
// import FileBase64 from 'react-file-base64'
import PropTypes from 'prop-types'

export class ImageField extends React.Component {
  handleRemoveImage = () => {
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
          className='control-label'
        >
          {props.schema.title ? props.schema.title : 'title undefined'}
        </label>

        <div>
          {props.disabled === false && props.formData && (
            <button onClick={this.handleRemoveImage}>Changer d'image</button>
          )}
          {/* TODO Find a better way to handle uploading images */}
          {/* props.disabled === false && props.formData === undefined && (
            <FileBase64
              multiple={false}
              onDone={this.getFile}
            />
          ) */}
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
