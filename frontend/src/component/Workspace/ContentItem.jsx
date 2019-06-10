import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import { Badge } from 'tracim_frontend_lib'

const ContentItem = props => {
  const status = props.contentType.availableStatuses.find(s => s.slug === props.statusSlug) || {hexcolor: '', label: '', faIcon: ''}
  return (
    <Link
      title={props.label}
      to={props.urlContent}
      className='content__item'
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
    </Link>
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
  read: PropTypes.bool,
  urlContent: PropTypes.string
}

ContentItem.defaultProps = {
  label: '',
  customClass: '',
  onClickItem: () => {},
  read: false,
  urlContent: ''
}
