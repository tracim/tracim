import React from 'react'
import FieldList from './FieldsList'
import FieldType from './FieldType'

class FormBuilder extends React.Component {
  render () {
    const { onChange, schema } = this.props
    return (
      <div style={{marginTop: '2%'}}>
        <div style={{
          float: 'left',
          width: '17%',
          textAlign: 'center'
        }}>
          <FieldType
            fieldType={'string'}
            name={'String'}
          />
          <FieldType
            fieldType={'integer'}
            name={'Integer'}
          />
          <FieldType
            fieldType={'number'}
            name={'Number'}
          />
          <FieldType
            fieldType={'array'}
            name={'Array'}
          />
          <FieldType
            fieldType={'boolean'}
            name={'Boolean'}
          />
        </div>

        <div style={{
          overflow: 'auto',
          width: '83%',
          display: 'inline',
          float: 'right'
        }}>
          <FieldList onChange={onChange} schema={schema} />
        </div>
      </div>
    )
  }
}

export default FormBuilder
