import React from 'react'
import PropTypes from 'prop-types'

require('./TextInput.styl')

// NOTE - S.G - 2020-10-26
// A thin-layer around <input type='text'> that sets the Tracim style and behaviour
// Also provide a onValidate handler which is called when Enter is pressed by the user.
export class TextInput extends React.Component {
  handleValidateIfEnterKey = (e) => {
    const { props } = this
    if (e.key !== 'Enter' || !props.onValidate) return
    props.onValidate(e)
  }

  render () {
    const { props } = this
    return (
      <div className='textinput__box'>
        <input
          autoFocus={props.autoFocus}
          type='text'
          className='textinput__text form-control primaryColorBorder'
          onChange={props.onChange}
          disabled={props.disabled}
          placeholder={props.placeholder}
          onKeyPress={this.handleValidateIfEnterKey}
          value={props.value}
        />
        {props.icon && <i className={`fas fa-fw fa-${props.icon} textinput__icon`} />}
      </div>
    )
  }
}

TextInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  autoFocus: PropTypes.bool,
  onValidate: PropTypes.func,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string
}

TextInput.defaultProps = {
  autoFocus: false,
  onValidate: undefined,
  disabled: false,
  placeholder: undefined,
  customClass: '',
  icon: undefined
}

export default TextInput
