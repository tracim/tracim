import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import CustomFormManager from './CustomFormManager.jsx'

require('./Information.styl')

export const Information = props => {
  return (
    <div className='Information__dynamicData'>
      <CustomFormManager
        title={props.t('Information_plural')}
        submitButtonClass='profile__customForm__submit primaryColorBorder'
        schemaObject={props.schemaObject}
        uiSchemaObject={props.uiSchemaObject}
        dataSchemaObject={props.dataSchemaObject}
        onSubmitDataSchema={props.onSubmitDataSchema}
      />

      <div className='Information__staticData'>
        <div>{props.t('Registration date: ')}{props.registrationDate}</div>
        <div>
          {props.t(
            '{{ authoredContentRevisionsCount }} interventions in {{ authoredContentRevisionsSpaceCount }} spaces',
            {
              authoredContentRevisionsCount: props.authoredContentRevisionsCount,
              authoredContentRevisionsSpaceCount: props.authoredContentRevisionsSpaceCount
            }
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
  dataSchemaObject: PropTypes.object,
  registrationDate: PropTypes.string,
  authoredContentRevisionsCount: PropTypes.number,
  authoredContentRevisionsSpaceCount: PropTypes.number,
  onSubmitDataSchema: PropTypes.func
}

Information.defaultProps = {
  schemaObject: {},
  uiSchemaObject: {},
  dataSchemaObject: {},
  registrationDate: '',
  authoredContentRevisionsCount: 0,
  authoredContentRevisionsSpaceCount: 0,
  onSubmitDataSchema: () => {}
}
