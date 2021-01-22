import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'

require('./Avatar.styl')
const color = require('color')

export const AVATAR_SIZE = {
  BIG: '100px',
  MEDIUM: '50px',
  SMALL: '30px',
  MINI: '20px'
}

export class Avatar extends React.Component {
  stringToHashCode = str => str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)

  intToRGB = i => {
    const c = (i & 0x00FFFFFF).toString(16).toUpperCase()
    return '00000'.substring(0, 6 - c.length) + c
  }

  generateColorFromName = publicName => {
    // INFO - G.B. - 20210112 - The default value is "lightGrey" at frontend_lib/css/Variable.styl
    if (publicName.length === 0) return '#f0f0f0'
    // code from https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
    const str = this.intToRGB(this.stringToHashCode(publicName))
    return color('#' + str).desaturate(0.90).hex()
  }

  getTwoLetters = name => {
    const trimedName = name.trim()
    const splitSpace = trimedName.split(' ')
    if (splitSpace.length >= 2) return `${splitSpace[0].substr(0, 1)}${splitSpace[1].substr(0, 1)}`

    const splitDash = trimedName.split('-')
    if (splitDash.length >= 2) return `${splitDash[0].substr(0, 1)}${splitDash[1].substr(0, 1)}`

    const splitDot = trimedName.split('.')
    if (splitDot.length >= 2) return `${splitDot[0].substr(0, 1)}${splitDot[1].substr(0, 1)}`

    return trimedName.substr(0, 2)
  }

  render () {
    const { props } = this

    const publicName = props.user.publicName || props.user.public_name
    const hasAvatar = Object.keys(props.user).includes('hasAvatar') ? props.user.hasAvatar : props.user.has_avatar
    const letterAvatar = publicName ? this.getTwoLetters(publicName.toUpperCase()) : '?'
    const sizeAsNumber = parseInt(props.size.replace('px', ''))

    const generatedColor = publicName ? this.generateColorFromName(publicName) : '#000'
    const fontSize = (widthInt => (widthInt / 2) % 2 === 0 ? widthInt : widthInt + 2)(parseInt(props.size)) / 2

    return (
      <div
        className={classnames('avatar-wrapper', props.customClass)}
        style={{ ...props.style }}
        title={publicName || props.t('Unknown')}
      >
        <div
          className='avatar'
          data-cy='avatar'
          style={{
            width: props.size,
            height: props.size,
            backgroundColor: generatedColor,
            fontSize: fontSize
          }}
        >
          {hasAvatar ? (
            <img
              className='avatar__img'
              src={`${props.apiUrl}/workspaces/1/files/1/preview/jpg/${sizeAsNumber}x${sizeAsNumber}/${props.filenameInUrl}`}
              alt={props.t('Avatar of {{publicName}}', { publicName })}
            />
          ) : <span>{letterAvatar}</span>}
        </div>
      </div>
    )
  }
}

Avatar.propTypes = {
  user: PropTypes.object,
  apiUrl: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  size: PropTypes.oneOf(Object.values(AVATAR_SIZE)),
  style: PropTypes.object,
  filenameInUrl: PropTypes.string
}

Avatar.defaultProps = {
  customClass: '',
  user: { publicName: '' },
  size: AVATAR_SIZE.MEDIUM,
  style: {},
  filenameInUrl: 'avatar'
}

export default translate()(Avatar)
