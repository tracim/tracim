import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'

import { getAvatarBaseUrl } from '../../helper.js'

// require('./Avatar.styl')  // see https://github.com/tracim/tracim/issues/1156

export const AVATAR_SIZE = {
  BIG: '100px',
  MEDIUM: '50px',
  SMALL: '30px',
  MINI: '20px'
}

export class Avatar extends React.Component {
  render () {
    const { props } = this

    const publicName = props.user.publicName || props.user.public_name
    const userId = props.user.userId || props.user.user_id || props.user.id
    const filenameInUrl = props.user.profileAvatarName || 'avatar'
    const sizeAsNumber = parseInt(props.size.replace('px', ''))
    const avatarBaseUrl = getAvatarBaseUrl(
      props.apiUrl,
      userId
    )

    return (
      <div
        className={classnames('avatar-wrapper', props.customClass)}
        style={{ ...props.style }}
        title={publicName || props.t('Unknown')}
        data-cy='avatar'
      >
        <img
          className='avatar'
          src={`${avatarBaseUrl}/preview/jpg/${sizeAsNumber}x${sizeAsNumber}/${filenameInUrl}`}
          alt={props.t('Avatar of {{publicName}}', { publicName })}
        />
      </div>
    )
  }
}

Avatar.propTypes = {
  user: PropTypes.object.isRequired,
  apiUrl: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  size: PropTypes.oneOf(Object.values(AVATAR_SIZE)),
  style: PropTypes.object
}

Avatar.defaultProps = {
  customClass: '',
  size: AVATAR_SIZE.MEDIUM,
  style: {}
}

export default translate()(Avatar)
