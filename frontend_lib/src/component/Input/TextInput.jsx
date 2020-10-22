import React from 'react'
import PropTypes from 'prop-types'

require('./TextInput.styl')

// A thin-layer around <input type='text'> that sets the Tracim style and behaviour
// Also provide a onValidate handler which is called when Enter is pressed by the user.
export class TextInput extends React.Component {
  validateIfEnterKey(e) {
    if (e.key !== 'Enter' || !props.onValidate) return
    props.onValidate(e)
  }

  render() {
    const { props } = this
    return <div class='textinput__box'>
      <input
        type='text'
        class='textinput__text form-control primaryColorBorderLighten'
        onChange={props.onChange}
        disabled={props.disabled}
        placeholder={props.placeholder}
        onKeyPress={this.validateIfEnterKey}
      />
      {props.icon && <i className={`fa fa-fw fa-${props.icon} textinput__icon`} />}
    </div>
  }
}

TextInput.propTypes = {
  onChange: PropTypes.func,
  onValidate: PropTypes.func,
  value: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string
}

TextInput.defaultProps = {
  onChange: () => {},
  onValidate: undefined,
  value: '',
  disabled: false,
  placeholder: undefined,
  customClass: '',
  icon: undefined
}

export default TextInput
