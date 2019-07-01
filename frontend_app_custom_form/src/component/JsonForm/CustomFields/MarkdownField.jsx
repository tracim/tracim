import React from 'react'
import ReactMde from 'react-mde'
import * as Showdown from 'showdown'
import 'react-mde/lib/styles/css/react-mde-all.css'

export class MarkdownField extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      tab: props.disabled ? 'preview' : 'write'
    }
    this.converter = new Showdown.Converter({
      tables: true,
      simplifiedAutoLink: true,
      strikethrough: true,
      tasklists: true
    })
  }

  handleValueChange = value => {
    this.props.onChange(value, this.props.id)
  }

  handleTabChange = tab => {
    this.setState({ tab })
  }

  render () {
    const p = this.props
    return (
      <div>
        <label
          className='control-label'>{p.schema.title ? p.schema.title : 'title undefined'}</label>
        {p.disabled && <div dangerouslySetInnerHTML={{__html: this.converter.makeHtml(p.formData)}} />}
        {!p.disabled && <ReactMde
          onChange={this.handleValueChange}
          onTabChange={this.handleTabChange}
          value={p.formData}
          readOnly={p.disabled}
          selectedTab={p.disabled ? 'preview' : this.state.tab}
          generateMarkdownPreview={markdown =>
            Promise.resolve(this.converter.makeHtml(markdown))
          }
        />}
      </div>
    )
  }
}

export default MarkdownField
