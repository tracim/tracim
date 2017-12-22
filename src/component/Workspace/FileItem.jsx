import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { FILE_TYPE } from '../../helper.js'

const FileItem = props => {
  const iconType = (() => {
    switch (props.type) {
      case FILE_TYPE.PAGE_HTML:
        return 'fa fa-file-word-o'
      case FILE_TYPE.PAGE_MARKDOWN:
        return 'fa fa-file-code-o'
      case FILE_TYPE.FILE:
        return 'fa fa-file-text-o docandfile-color'
      case FILE_TYPE.THREAD:
        return 'fa fa-comments-o talk-color'
      case FILE_TYPE.TASK:
        return 'fa fa-list-ul task-color'
      case FILE_TYPE.ISSUE:
        return 'fa fa-ticket'
    }
  })()

  const iconStatus = (() => {
    switch (props.status) {
      case 'current':
        return 'fa fa-cogs current-color'
      case 'validated':
        return 'fa fa-check validated-color'
      case 'canceled':
        return 'fa fa-ban canceled-color'
      case 'outdated':
        return '' // @TODO
    }
  })()

  return (
    <div className={classnames('file', 'align-items-center', props.customClass)} onClick={props.onClickItem}>
      <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
        <div className='file__type'>
          <i className={iconType} />
        </div>
      </div>
      <div className='col-8 col-sm-8 col-md-8 col-lg-8 col-xl-10'>
        <div className='file__name'>
          <div className='file__name__text'>
            { props.name }
          </div>
          <div className='file__name__icons d-none d-md-flex'>
            <div className='file__name__icons__download'>
              <i className='fa fa-download' />
            </div>
            <div className='file__name__icons__archive'>
              <i className='fa fa-archive' />
            </div>
            <div className='file__name__icons__delete'>
              <i className='fa fa-trash-o' />
            </div>
          </div>
        </div>
      </div>
      <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
        <div className='file__status'>
          <i className={iconStatus} />
        </div>
      </div>
    </div>
  )
}

export default FileItem

FileItem.propTypes = {
  type: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  name: PropTypes.string,
  onClickItem: PropTypes.func
}

FileItem.defaultProps = {
  name: '',
  customClass: '',
  onClickItem: () => {}
}
