import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

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
      <div
        className={classnames('textInputComponent', props.className)}
      >
        <input
          autoFocus={props.autoFocus}
          type='text'
          className={classnames('textInputComponent__text', props.inputClassName)}
          onChange={props.onChange}
          disabled={props.disabled}
          placeholder={props.placeholder}
          onKeyPress={this.handleValidateIfEnterKey}
          value={props.value}
        />
        {props.icon && (
          <i className={`fas fa-fw fa-${props.icon} textInputComponent__icon`} />
        )}
      </div>
    )
  }
}

TextInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  autoFocus: PropTypes.bool,
  onValidate: PropTypes.func,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string
}

TextInput.defaultProps = {
  className: '',
  inputClassName: '',
  autoFocus: false,
  onValidate: undefined,
  disabled: false,
  placeholder: undefined,
  customClass: '',
  icon: undefined
}

export default TextInput
