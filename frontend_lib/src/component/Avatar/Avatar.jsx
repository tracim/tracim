import React from 'react'
import PropTypes from 'prop-types'

// require('./Avatar.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

export class Avatar extends React.Component {
  stringToHashCode = str => str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)

  intToRGB = i => {
    const c = (i & 0x00FFFFFF).toString(16).toUpperCase()
    return '00000'.substring(0, 6 - c.length) + c
  }

  generateColorFromName = publicName => {
    // code from https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
    const str = this.intToRGB(this.stringToHashCode(publicName))
    return color('#' + str).desaturate(0.90).hex()
  }

  getTwoLetter = name => {
    const splitSpace = name.split(' ')
    if (splitSpace.length >= 2) return `${splitSpace[0].substr(0, 1)}${splitSpace[1].substr(0, 1)}`

    const splitDash = name.split('-')
    if (name.split('-').length >= 2) return `${splitDash[0].substr(0, 1)}${splitDash[1].substr(0, 1)}`

    const splitDot = name.split('.')
    if (name.split('.').length >= 2) return `${splitDot[0].substr(0, 1)}${splitDot[1].substr(0, 1)}`

    return name.substr(0, 2)
  }

  render () {
    const { props } = this

    const generatedColor = this.generateColorFromName(props.publicName)
    const fontSize = (widthInt => (widthInt / 2) % 2 === 0 ? widthInt : widthInt + 2)(parseInt(props.width)) / 2

    return (
      <div className='avatar-wrapper' style={{ ...props.style }} title={props.publicName}>
        <div
          className='avatar'
          data-cy='avatar'
          style={{
            width: props.width,
            height: props.width,
            borderRadius: props.width,
            backgroundColor: generatedColor,
            fontSize: fontSize
          }}
        >
          {this.getTwoLetter(props.publicName.toUpperCase())}
        </div>
      </div>
    )
  }
}

Avatar.propTypes = {
  publicName: PropTypes.string.isRequired,
  width: PropTypes.string,
  style: PropTypes.object
}

Avatar.defaultProps = {
  width: '50px',
  style: {}
}

export default Avatar
