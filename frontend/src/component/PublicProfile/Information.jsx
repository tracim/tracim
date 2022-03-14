import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import CustomFormManager from './CustomFormManager.jsx'

require('./Information.styl')

export const Information = props => {
  const getInterventionString = () => {
    let interventionString

    if (props.authoredContentRevisionsCount > 10) {
      interventionString = props.t('{{ count }} interventionMoreThanTen ', { count: props.authoredContentRevisionsCount })
    } else {
      interventionString = props.t('{{ count }} intervention ', { count: props.authoredContentRevisionsCount })
    }
    return interventionString
  }

  const getSpaceString = () => {
    return props.authoredContentRevisionsSpaceCount > 10
      ? props.t('in {{ count }} spaceMoreThanTen', { count: props.authoredContentRevisionsSpaceCount })
      : props.t('in {{ count }} space', { count: props.authoredContentRevisionsSpaceCount })
  }

  return (
    <div className='Information__dynamicData'>
      <CustomFormManager
        title={props.t('Information_plural')}
        submitButtonClass='profile__customForm__submit primaryColorBorder'
        schemaObject={props.schemaObject}
        uiSchemaObject={props.uiSchemaObject}
        dataSchemaObject={props.dataSchemaObject}
        displayEditButton={props.displayEditButton}
        onSubmitDataSchema={props.onSubmitDataSchema}
      />

      <div className='Information__staticData'>
        <div className='Information__staticData__registrationDate'>
          <div className='Information__staticData__registrationDate__label'>
            {props.t('Registration date:')}
          </div>
          <div className='Information__staticData__registrationDate__value'>
            {props.registrationDate}
          </div>
        </div>
        <div>
          {getInterventionString()}
          {getSpaceString()}
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
