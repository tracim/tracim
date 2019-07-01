import React from 'react'
import {
  DisplayState
} from 'tracim_frontend_lib'
import { MODE } from '../helper.js'
import { translate } from 'react-i18next'
import JsonForm from './JsonForm/JsonForm.jsx'

const CustomFormComponent = props => {
  return (
    <div className='custom-form__contentpage__left__wrapper'>
      {props.isArchived && (
        <DisplayState
          msg={props.t('This content is archived')}
          btnType='button'
          icon='archive'
          btnLabel={props.t('Restore')}
          onClickBtn={props.onClickRestoreArchived}
        />
      )}

      {props.isDeleted && (
        <DisplayState
          msg={props.t('This content is deleted')}
          btnType='button'
          icon='trash'
          btnLabel={props.t('Restore')}
          onClickBtn={props.onClickRestoreDeleted}
        />
      )}

      {props.isDeprecated && (
        <DisplayState
          msg={props.t('This content is deprecated')}
          icon={props.deprecatedStatus.faIcon}
        />
      )}

      <div className='wsContentHtmlDocument__contentpage__textnote custom-form__contentpage__textnote'>
        {props.mode === MODE.VIEW && props.isDraftAvailable && (
          <DisplayState
            msg={props.t('You have a pending draft')}
            type='link'
            icon='hand-o-right'
            btnLabel={props.t('resume writing')}
            onClickBtn={props.onClickShowDraft}
          />
        )}

        {(props.mode === MODE.VIEW || props.mode === MODE.REVISION) && (
          <JsonForm
            id={props.wysiwygNewVersion}
            customClass={'custom-form__editionmode'}
            customColor={props.customColor}
            onClickCancelBtn={props.onClickCloseEditMode}
            disableValidateBtn={props.disableValidateBtn}
            onClickValidateBtn={props.onClickValidateBtn}
            text={''}
            schema={props.schema}
            uiSchema={props.uischema}
            formData={props.formdata}
            isDisable
            onChange={props.onChangeForm}
          />
        )}
        {props.mode === MODE.EDIT && (
          <JsonForm
            id={props.wysiwygNewVersion}
            customClass={'custom-form__editionmode'}
            customColor={props.customColor}
            onClickCancelBtn={props.onClickCloseEditMode}
            disableValidateBtn={props.disableValidateBtn}
            onClickValidateBtn={props.onClickValidateBtn}
            text={''}
            schema={props.schema}
            uiSchema={props.uischema}
            formData={props.formdata}
            onChange={props.onChangeForm}
            isDisable={false}
          />
        )}
      </div>
    </div>
  )
}

export default translate()(CustomFormComponent)
