import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import onClickOutside from 'react-onclickoutside'
import { Popover, PopoverBody } from 'reactstrap'
import Icon from '../Icon/Icon.jsx'
import IconButton from '../Button/IconButton.jsx'
// require('./DisplayAddedFileToComment.styl) // see https://github.com/tracim/tracim/issues/1156

export class DisplayAddedFileToComment extends React.Component {
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
      e.target.parentNode.className.includes('DisplayAddedFileToComment__popover__item__deleteBtn')
    ) return
    this.setState({ showPopoverFileList: false })
  }

  handleTogglePopupFileList = () => this.setState(prev => ({ showPopoverFileList: !prev.showPopoverFileList }))

  render () {
    const { props, state } = this
    if (props.fileList.length === 0) return null
    return (
      <div className='DisplayAddedFileToComment'>
        <div
          className='DisplayAddedFileToComment__message'
          onClick={this.handleTogglePopupFileList}
          id='popoverAddedFileToCommentList'
        >
          <Icon
            icon='fas fa-paperclip'
            customClass='DisplayAddedFileToComment__message__iconFile'
            title={props.t('See files')}
          />
          <div className='DisplayAddedFileToComment__message__text'>
            {props.t('{{numberOfFile}} files added', { numberOfFile: props.fileList.length })}
          </div>
          <Icon
            icon='fas fa-th-list'
            customClass='DisplayAddedFileToComment__message__listIcon'
            title={props.t('See files')}
          />
        </div>

        <Popover
          placement='top'
          isOpen={state.showPopoverFileList}
          target='popoverAddedFileToCommentList'
          className='popoverAddedFileToCommentList'
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
                    className='DisplayAddedFileToComment__popover__item'
                    title={isFileInError ? file.errorMessage : ''}
                    key={`${file.file.name}_${i}`}
                  >
                    {(isFileInError
                      ? (
                        <Icon
                          icon='fas fa-fw fa-exclamation-triangle'
                          customClass='DisplayAddedFileToComment__popover__item__iconFile inError'
                          title=''
                        />
                      )
                      : (
                        <Icon
                          icon='fas fa-fw fa-paperclip'
                          customClass='DisplayAddedFileToComment__popover__item__iconFile'
                          title=''
                        />
                      )
                    )}

                    <div
                      className='DisplayAddedFileToComment__popover__item__text'
                      title={file.file.name}
                    >
                      {file.file.name}
                    </div>

                    <IconButton
                      customClass='DisplayAddedFileToComment__popover__item__deleteBtn'
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

export default translate()(onClickOutside(DisplayAddedFileToComment))

DisplayAddedFileToComment.propTypes = {
  fileList: PropTypes.array,
  onRemoveCommentAsFile: PropTypes.func,
  color: PropTypes.string
}

DisplayAddedFileToComment.defaultProps = {
  fileList: [],
  onRemoveCommentAsFile: () => {},
  color: ''
}
