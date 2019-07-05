import React from 'react'
import JSONInput from 'react-json-editor-ajrm'
import locale from 'react-json-editor-ajrm/locale/fr'

class JsonFormEditor extends React.Component {
  render () {
    return (
      <div style={{marginTop: '2%'}}>
        <div>
          <p>schema :</p>
          <JSONInput
            id='schema'
            locale={locale}
            height='550px'
            width={'100%'}
            placeholder={this.props.schema}
            onChange={(data) => this.props.onSchemaChange(data.jsObject)}
          />
        </div>

        <div>
          <p>uischema :</p>

          <JSONInput
            id='uischema'
            locale={locale}
            height='250px'
            width={'100%'}
            onChange={this.props.onUiSchemaChange}
          />
        </div>
      </div>
    )
  }
}

export default JsonFormEditor
