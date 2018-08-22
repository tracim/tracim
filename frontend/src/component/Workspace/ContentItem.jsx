import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import BtnExtandedAction from './BtnExtandedAction.jsx'

const ContentItem = props => {
  if (props.contentType === null) return null // this means the endpoint system/content_type hasn't responded yet

  const status = props.contentType.availableStatuses.find(s => s.slug === props.statusSlug)
  return (
    <div className={classnames('content', 'align-items-center', 'primaryColorBgLightenHover', {'item-last': props.isLast}, props.customClass)} onClick={props.onClickItem}>
      <div className='content__type' style={{color: props.contentType.hexcolor}}>
        <i className={`fa fa-fw fa-${props.faIcon}`} />
      </div>

      <div className='content__name'>
        <div className='content__name__text'>
          { props.label }
        </div>
      </div>

      <div className='d-none d-md-flex'>
        <BtnExtandedAction onClickExtendedAction={props.onClickExtendedAction} />
      </div>

      <div className={classnames('content__status d-none d-xl-flex align-items-center justify-content-between')} style={{color: status.hexcolor}}>
        <div className='content__status__text'>
          {status.label}
        </div>
        <div className='content__status__icon'>
          <i className={`fa fa-fw fa-${status.faIcon}`} />
        </div>
      </div>
    </div>
  )
}

export default ContentItem

ContentItem.propTypes = {
  type: PropTypes.string.isRequired,
  statusSlug: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  label: PropTypes.string,
  contentType: PropTypes.object,
  onClickItem: PropTypes.func,
  faIcon: PropTypes.string
}

ContentItem.defaultProps = {
  label: '',
  customClass: '',
  onClickItem: () => {}
}
