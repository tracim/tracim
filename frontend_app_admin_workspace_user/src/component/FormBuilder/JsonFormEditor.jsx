import React from 'react'
import JSONInput from 'react-json-editor-ajrm'
import locale from 'react-json-editor-ajrm/locale/fr'
import PropTypes from 'prop-types'

class JsonFormEditor extends React.Component {
  render () {
    const { props } = this

    const schema = { ...props.schema }
    delete schema.change
    return (
      <div style={{ marginTop: '2%' }}>
        <div>
          <p>schema :</p>
          <JSONInput
            id='schema'
            locale={locale}
            height='550px'
            width='100%'
            placeholder={props.schema}
            onChange={(data) => props.onSchemaChange(data.jsObject)}
          />
        </div>

        <div>
          <p>uischema :</p>

          <JSONInput
            id='uischema'
            locale={locale}
            height='250px'
            width='100%'
            placeholder={props.uiSchema}
            onChange={props.onUiSchemaChange}
          />
        </div>
      </div>
    )
  }
}

export default JsonFormEditor

JsonFormEditor.propTypes = {
  schema: PropTypes.object,
  onSchemaChange: PropTypes.func,
  onUiSchemaChange: PropTypes.func
}
