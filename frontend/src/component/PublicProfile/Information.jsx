import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import CustomFormManager from './CustomFormManager.jsx'

export const Information = props => {
  return (
    <div>
      <CustomFormManager
        title={props.t('Information_plural')}
        schemaObject={props.schemaObject}
        uiSchemaObject={props.uiSchemaObject}
        dataSchemaObject={props.dataSchemaObject}
      />

      <div>
        <div>{props.t('Registration date: ')}</div>
        <div>
          {props.t(
            '{{ actionNumber }} interventions in {{ spaceNumber }} spaces',
            { actionNumber: 1337, spaceNumber: 42 }
          )}
        </div>
      </div>
    </div>
  )
}

export default translate()(Information)

Information.propTypes = {
  schemaObject: PropTypes.object,
  uiSchemaObject: PropTypes.object,
  dataSchemaObject: PropTypes.object
}

Information.defaultProps = {
  schemaObject: {},
  uiSchemaObject: {},
  dataSchemaObject: {}
}
