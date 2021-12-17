import React from 'react'
import PropTypes from 'prop-types'

// INFO - G.B. - 2021-12-16
// A thin-layer around the input that sets the Tracim style and behaviour
// Also provide a onValidate handler which is called when Enter is pressed by the user.
export class DateInput extends React.Component {
  handleValidateIfEnterKey = (e) => {
    const { props } = this
    if (e.key !== 'Enter' || !props.onValidate) return
    props.onValidate(e)
  }

  render () {
    const { props } = this
    return (
      <input
        autoFocus={props.autoFocus}
        type='date'
        className='dateInput form-control primaryColorBorder'
        onChange={props.onChange}
        disabled={props.disabled}
        placeholder={props.placeholder}
        onKeyPress={this.handleValidateIfEnterKey}
        value={props.value}
      />
    )
  }
}

DateInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  autoFocus: PropTypes.bool,
  onValidate: PropTypes.func,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string
}

DateInput.defaultProps = {
  autoFocus: false,
  onValidate: undefined,
  disabled: false,
  placeholder: undefined,
  customClass: '',
  icon: undefined
}

export default DateInput
