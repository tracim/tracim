import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Badge, Avatar } from 'tracim_frontend_lib'

require('./ContentItemResearch.styl')

const ContentItemResearch = props => {
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

      <div className='content__path'>
        { props.path }
      </div>

      <div className='content__lastModification'>
        <Avatar
          width={'40px'}
          style={{
            display: 'inline-block',
            marginRight: '10px'
          }}
          publicName={props.lastModificationAuthor}
        />
        { props.lastModificationTime }
      </div>

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

export default translate()(ContentItemResearch)

ContentItemResearch.propTypes = {
  statusSlug: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  label: PropTypes.string,
  fileName: PropTypes.string,
  fileExtension: PropTypes.string,
  contentType: PropTypes.object,
  faIcon: PropTypes.string,
  urlContent: PropTypes.string
}

ContentItemResearch.defaultProps = {
  label: '',
  customClass: '',
  urlContent: ''
}
