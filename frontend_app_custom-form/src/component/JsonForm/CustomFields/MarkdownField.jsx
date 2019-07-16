import React from 'react'
import ReactMde from 'react-mde'
import 'react-mde/lib/styles/css/react-mde-all.css'
import PropTypes from 'prop-types'
import mdc from 'markdown-core/src/index-browser'

export class MarkdownField extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      tab: props.disabled ? 'preview' : 'write'
    }
  }

  handleValueChange = value => {
    this.props.onChange(value, this.props.id)
  }

  handleTabChange = tab => {
    this.setState({ tab })
  }

  componentDidUpdate () {
    if (this.props.disabled || this.state.tab === 'preview') {
      try {
        mdc.init(this.props.formData)
      } catch (error) {}
    }
  }

  componentDidMount () {
    if (this.props.disabled || this.state.tab === 'preview') {
      try {
        mdc.init(this.props.formData)
      } catch (error) {}
    }
  }

  render () {
    const p = this.props
    return (
      <div>
        <label className='control-label'>
          {p.schema.title ? p.schema.title : 'title undefined'}
        </label>
        {!p.disabled && (
          <p>
            <input type={'button'} onClick={() => this.setState({tab: 'write'})} value={'Write'} />
            <input type={'button'} onClick={() => this.setState({tab: 'preview'})} value={'Preview'} />
          </p>
        )}
        {(p.disabled || this.state.tab === 'preview') && (
          <article id='preview' />
        )}
        {(!p.disabled && this.state.tab === 'write') && (
          <ReactMde
            onChange={this.handleValueChange}
            onTabChange={this.handleTabChange}
            value={p.formData}
            readOnly={p.disabled}
          />
        )}
      </div>
    )
  }
}

export default MarkdownField

MarkdownField.defaultProps = {
  disabled: false
}

MarkdownField.propType = {
  onChange: PropTypes.func,
  schema: PropTypes.object,
  formData: PropTypes.object,
  disabled: PropTypes.bool
}
