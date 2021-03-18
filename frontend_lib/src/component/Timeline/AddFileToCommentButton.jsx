import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import PopupUploadFile from '../../container/PopupUploadFile.jsx'

// const MAXIMUM_IMAGE_SIZE = 10 * 1024 * 1024 // 10mo
// const ALLOWED_IMAGE_MIMETYPES = [
//   'image/jpeg',
//   'image/png',
//   'image/bmp',
//   'image/gif',
//   'image/webp'
// ]

export class AddFileToCommentButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showUploadPopup: false
    }
  }

  handleDisplayPopupUpload = e => {
    e.preventDefault()
    this.setState(prev => ({ showUploadPopup: !prev.showUploadPopup }))
  }

  handleClosePopup = () => {
    this.setState({ showUploadPopup: false })
  }

  handleValidatePopupOverride = fileToUploadList => {
    this.handleClosePopup()
    this.props.onValidateCommentFileToUpload(fileToUploadList)
  }

  render () {
    const { props, state } = this

    return (
      <>
        <button
          className='AddFileToCommentButton'
          onClick={this.handleDisplayPopupUpload}
          style={{ color: props.color }}
        >
          <i className='fas fa-paperclip' />
        </button>

        {state.showUploadPopup && (
          <PopupUploadFile
            label={props.t('Upload a file')}
            validateLabel={props.t('Validate')}
            uploadUrl=''
            color={props.color} // app file color
            faIcon='fas fa-paperclip'
            onClose={this.handleClosePopup}
            onSuccess={this.handleClosePopup}
            multipleFiles
            onValidateOverride={this.handleValidatePopupOverride}
          />
        )}
      </>
    )
  }
}

export default translate()(AddFileToCommentButton)

AddFileToCommentButton.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  workspaceId: PropTypes.string.isRequired,
  color: PropTypes.string,
  onValidateCommentFileToUpload: PropTypes.func
}

AddFileToCommentButton.defaultProps = {
  color: '#ffa500',
  onValidateCommentFileToUpload: () => {}
}
