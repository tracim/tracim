import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import PopupUploadFile from '../../container/PopupUploadFile.jsx'
import IconButton from '../Button/IconButton.jsx'

export class AddFileToUploadButton extends React.Component {
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
        <IconButton
          customClass='AddFileToCommentButton'
          onClick={this.handleDisplayPopupUpload}
          color={props.color}
          icon='fas fa-paperclip'
        />

        {state.showUploadPopup && (
          <PopupUploadFile
            label={props.t('Upload a file')}
            validateLabel={props.t('Validate')}
            uploadUrl=''
            color={props.color}
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

export default translate()(AddFileToUploadButton)

AddFileToUploadButton.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  workspaceId: PropTypes.string.isRequired,
  color: PropTypes.string,
  onValidateCommentFileToUpload: PropTypes.func
}

AddFileToUploadButton.defaultProps = {
  color: '#ffa500',
  onValidateCommentFileToUpload: () => {}
}
