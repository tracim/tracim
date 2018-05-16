import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import BtnExtandedAction from '../BtnExtandedAction/ExtandedAction.jsx'

const FileItem = props => {
  const iconStatus = (() => {
    switch (props.status) {
      case 'current':
        return 'fa fa-fw fa-cogs'
      case 'validated':
        return 'fa fa-fw fa-check'
      case 'canceled':
        return 'fa fa-fw fa-times'
      case 'outdated':
        return 'fa fa-fw fa-ban'
    }
  })()

  const textStatus = (() => {
    switch (props.status) {
      case 'current':
        return 'En cours'
      case 'validated':
        return 'Validé'
      case 'canceled':
        return 'Annulé'
      case 'outdated':
        return 'Obsolète'
    }
  })()

  const colorStatus = (() => {
    switch (props.status) {
      case 'current':
        return ' currentColor'
      case 'validated':
        return ' validateColor'
      case 'canceled':
        return ' cancelColor'
      case 'outdated':
        return ' outdateColor'
    }
  })()

  return (
    <div className={classnames('file', 'align-items-center', {'item-last': props.isLast}, props.customClass)} onClick={props.onClickItem}>
      <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
        <div className='file__type'>
          <i className={props.icon} />
        </div>
      </div>

      <div className='col-8 col-sm-8 col-md-8 col-lg-8 col-xl-9'>
        <div className='file__name'>
          <div className='file__name__text'>
            { props.name }
          </div>

          <div className='d-none d-md-flex'>
            <BtnExtandedAction />
          </div>

          {/*
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
          */ }
        </div>
      </div>

      <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-2'>
        <div className={classnames('file__status d-flex align-items-center justify-content-start') + colorStatus}>
          <div className='file__status__icon d-block '>
            <i className={iconStatus} />
          </div>
          <div className='file__status__text d-none d-xl-block'>
            {textStatus}
          </div>
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
