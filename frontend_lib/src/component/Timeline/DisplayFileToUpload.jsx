import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import onClickOutside from 'react-onclickoutside'
import { Popover, PopoverBody } from 'reactstrap'
import Icon from '../Icon/Icon.jsx'
import IconButton from '../Button/IconButton.jsx'
// require('./DisplayFileToUpload.styl) // see https://github.com/tracim/tracim/issues/1156

export class DisplayFileToUpload extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showPopoverFileList: false
    }
  }

  handleClickOutside = e => {
    // INFO - CH - 20210317 - test below is to avoid closing the popup when wanting to click on the delete button
    if (
      e.target.parentNode.className &&
      e.target.parentNode.className.includes('DisplayFileToUpload__popover__item__deleteBtn')
    ) return
    this.setState({ showPopoverFileList: false })
  }

  handleTogglePopupFileList = () => this.setState(prev => ({ showPopoverFileList: !prev.showPopoverFileList }))

  render () {
    const { props, state } = this
    if (props.fileList.length === 0) return null
    return (
      <div className='DisplayFileToUpload'>
        <div
          className='DisplayFileToUpload__message'
          onClick={this.handleTogglePopupFileList}
          id='popoverFileToUploadList'
        >
          <Icon
            icon='fas fa-paperclip'
            customClass='DisplayFileToUpload__message__iconFile'
            title={props.t('See files')}
          />
          <div className='DisplayFileToUpload__message__text'>
            {(
              props.fileList.length === 1
                ? props.t('1 file selected')
                : props.t('{{count}} files selected', { count: props.fileList.length })
            )}
          </div>
          <Icon
            icon='fas fa-th-list'
            customClass='DisplayFileToUpload__message__listIcon'
            title={props.t('See files')}
          />
        </div>

        <Popover
          placement='top'
          isOpen={state.showPopoverFileList}
          target='popoverFileToUploadList'
          className='popoverFileToUploadList'
          toggle={this.handleTogglePopupFileList} // eslint-disable-line react/jsx-handler-names
          trigger='click'
        >
          {({ scheduleUpdate }) => (
            <PopoverBody>
              {props.fileList.map((file, i) => {
                if (!file || !file.file) return null
                const isFileInError = file.errorMessage !== ''
                return (
                  <div
                    className='DisplayFileToUpload__popover__item'
                    title={isFileInError ? file.errorMessage : ''}
                    key={`${file.file.name}_${i}`}
                  >
                    {(isFileInError
                      ? (
                        <Icon
                          icon='fas fa-fw fa-exclamation-triangle'
                          customClass='DisplayFileToUpload__popover__item__iconFile inError'
                          title={isFileInError ? file.errorMessage : ''}
                        />
                      )
                      : (
                        <Icon
                          icon='fas fa-fw fa-paperclip'
                          customClass='DisplayFileToUpload__popover__item__iconFile'
                          title=''
                        />
                      )
                    )}

                    <div
                      className='DisplayFileToUpload__popover__item__text'
                      title={isFileInError ? file.errorMessage : file.file.name}
                    >
                      {file.file.name}
                    </div>

                    <IconButton
                      customClass='DisplayFileToUpload__popover__item__deleteBtn'
                      intent='link'
                      icon='far fa-trash-alt'
                      color={props.color}
                      title={props.t('Remove file')}
                      mode='dark'
                      onClick={e => {
                        props.onRemoveCommentAsFile(file)
                        if (props.fileList.length === 1) this.setState({ showPopoverFileList: false })
                        scheduleUpdate(e)
                      }}
                    />
                  </div>
                )
              })}
            </PopoverBody>
          )}
        </Popover>
      </div>
    )
  }
}

export default translate()(onClickOutside(DisplayFileToUpload))

DisplayFileToUpload.propTypes = {
  fileList: PropTypes.array,
  onRemoveCommentAsFile: PropTypes.func,
  color: PropTypes.string
}

DisplayFileToUpload.defaultProps = {
  fileList: [],
  onRemoveCommentAsFile: () => {},
  color: ''
}
