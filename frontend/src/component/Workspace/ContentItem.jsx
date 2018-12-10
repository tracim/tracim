import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import { Badge } from 'tracim_frontend_lib'

const ContentItem = props => {
  if (props.contentType === null) return null // this means the endpoint system/content_type hasn't responded yet

  const status = props.contentType.availableStatuses.find(s => s.slug === props.statusSlug) || {hexcolor: '', label: '', faIcon: ''}
  return (
    <div
      className={
        classnames('content primaryColorBgLightenHover', {'item-last': props.isLast, 'read': props.read}, props.customClass)
      }
      onClick={props.onClickItem}
      title={props.label}
    >
      <div className='content__type' style={{color: props.contentType.hexcolor}}>
        <i className={`fa fa-fw fa-${props.faIcon}`} />
      </div>

      <div className='content__name'>
        { props.label }
        { props.contentType.slug === 'file' && (
          <Badge text={props.fileExtension} customClass='badgeBackgroundColor' />
        )}
      </div>

      {props.idRoleUserWorkspace >= 2 && (
        <div className='d-none d-md-block'>
          <BtnExtandedAction
            idRoleUserWorkspace={props.idRoleUserWorkspace}
            onClickExtendedAction={props.onClickExtendedAction}
          />
        </div>
      )}

      <div
        className='content__status d-sm-flex justify-content-between align-items-center'
        style={{color: status.hexcolor}}
      >
        <div className='content__status__text d-none d-sm-block'>
          {props.t(status.label)}
        </div>
        <div className='content__status__icon'>
          <i className={`fa fa-fw fa-${status.faIcon}`} />
        </div>
      </div>
    </div>
  )
}

export default translate()(ContentItem)

ContentItem.propTypes = {
  statusSlug: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  label: PropTypes.string,
  fileName: PropTypes.string,
  fileExtension: PropTypes.string,
  contentType: PropTypes.object,
  onClickItem: PropTypes.func,
  faIcon: PropTypes.string,
  read: PropTypes.bool
}

ContentItem.defaultProps = {
  label: '',
  customClass: '',
  onClickItem: () => {},
  read: false
}
