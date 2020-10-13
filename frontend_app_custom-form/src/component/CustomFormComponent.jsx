import React from 'react'
import {
  PromptMessage
} from 'tracim_frontend_lib'
import { MODE } from '../helper.js'
import { translate } from 'react-i18next'
import JsonForm from './JsonForm/JsonForm.jsx'

const CustomFormComponent = props => {
  return (
    <div className='custom-form__contentpage__left__wrapper'>
      {props.isArchived && (
        <PromptMessage
          msg={props.t('This content is archived')}
          btnType='button'
          icon='archive'
          btnLabel={props.t('Restore')}
          onClickBtn={props.onClickRestoreArchived}
        />
      )}

      {props.isDeleted && (
        <PromptMessage
          msg={props.t('This content is deleted')}
          btnType='button'
          icon='trash'
          btnLabel={props.t('Restore')}
          onClickBtn={props.onClickRestoreDeleted}
        />
      )}

      {props.isDeprecated && (
        <PromptMessage
          msg={props.t('This content is deprecated')}
          icon={props.deprecatedStatus.faIcon}
        />
      )}

      <div
        className='wsContentHtmlDocument__contentpage__textnote custom-form__contentpage__textnote'
      >
        {props.mode === MODE.VIEW && props.isDraftAvailable && (
          <PromptMessage
            msg={props.t('You have a pending draft')}
            type='link'
            icon='hand-o-right'
            btnLabel={props.t('resume writing')}
            onClickBtn={props.onClickShowDraft}
          />
        )}

        {(props.mode === MODE.VIEW || props.mode === MODE.REVISION) && (
          <div>
            <div className='custom-form__contentpage__textnote__version'>
              version n°
              <div
                dangerouslySetInnerHTML={{ __html: props.mode === MODE.VIEW ? props.lastVersion : props.version }}
              />
              {props.mode === MODE.REVISION && (
                <div
                  className='custom-form__contentpage__textnote__lastversion outlineTextBtn'
                >
                  ({props.t('latest version :')} {props.lastVersion})
                </div>
              )}
            </div>
          </div>
        )}
        <JsonForm
          customClass='custom-form__editionmode'
          customColor={props.customColor}
          onClickCancelBtn={props.onClickCloseEditMode}
          disableValidateBtn={props.disableValidateBtn}
          onClickValidateBtn={props.onClickValidateBtn}
          schema={props.schema}
          uiSchema={props.uischema}
          formData={props.formdata}
          isDisable={((props.mode === MODE.VIEW || props.mode === MODE.REVISION) && props.mode !== MODE.EDIT)}
          onChange={props.onChangeForm}
          contextForm={props.contextForm}
        />
      </div>
    </div>
  )
}

export default translate()(CustomFormComponent)
