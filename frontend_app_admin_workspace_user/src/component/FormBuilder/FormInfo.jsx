import React from 'react'
import PropTypes from 'prop-types'

class FormInfo extends React.Component {
  handleChange (event) {
    this.props.onChange(event.target.name, event.target.value)
  }

  render () {
    return (
      <form>
        <div className='formInfo'>
          <span>Label</span>
          <input type='text' name='label' onChange={this.handleChange.bind(this)} />

          <span>Label de création</span>
          <input type='text' name='creationLabel' onChange={this.handleChange.bind(this)} />

          <span>Icône</span>
          <input type='text' name='fa_icon' onChange={this.handleChange.bind(this)} />

          <span>Couleur</span>
          <input type='color' name='hexColor' onChange={this.handleChange.bind(this)} />

          <button type='button' onClick={this.props.onSave}>Sauvegarder</button>
        </div>
      </form>
    )
  }
}

export default FormInfo

FormInfo.propTypes = {
  onChange: PropTypes.func,
  onSave: PropTypes.func
}
