import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { AVATAR_SIZE, FilenameWithExtension, Avatar } from 'tracim_frontend_lib'
import { FETCH_CONFIG } from '../../util/helper.js'

require('./ContentItemSearch.styl')

export const ContentItemSearch = props => {
  const status = props.contentType.availableStatuses.find(s => s.slug === props.statusSlug) || { hexcolor: '', label: '', faIcon: '' }

  return (
    <Link
      to={props.urlContent}
      className='content__item'
      data-cy='content__item'
    >
      <div
        className='content__type'
        title={props.t(props.contentType.label)}
        style={{ color: props.contentType.hexcolor }}
      >
        <i className={`fa-fw ${props.faIcon}`} />
      </div>

      <FilenameWithExtension file={props} customClass='content__name searchResultPage' />

      <div className='content__path' title={props.path}>
        {props.path}
      </div>

      <div className='content__lastModification' title={props.lastModificationFormated}>
        <Avatar
          size={AVATAR_SIZE.SMALL}
          user={props.lastModificationAuthor}
          apiUrl={FETCH_CONFIG.apiUrl}
          style={{
            display: 'inline-block',
            marginInlineEnd: '10px'
          }}
        />
        {props.lastModificationTime}
      </div>

      <div
        className='content__status'
        title={props.t(status.label)}
      >
        <div className='content__status__icon'>
          <i
            className={`fa-fw ${status.faIcon}`}
            style={{ color: status.hexcolor }}
          />
        </div>
        <div className='content__status__text'>
          {props.t(status.label)}
        </div>
      </div>
    </Link>
  )
}

export default translate()(ContentItemSearch)

ContentItemSearch.propTypes = {
  statusSlug: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  label: PropTypes.string,
  fileName: PropTypes.string,
  fileExtension: PropTypes.string,
  contentType: PropTypes.object,
  faIcon: PropTypes.string,
  urlContent: PropTypes.string
}

ContentItemSearch.defaultProps = {
  label: '',
  customClass: '',
  urlContent: ''
}
