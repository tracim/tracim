import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { CustomFormManager } from 'tracim_frontend_lib'

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
          {props.t('{{ count }} intervention ', { count: props.authoredContentRevisionsCount })}
          {props.t('in {{ count }} space', { count: props.authoredContentRevisionsSpaceCount })}
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
