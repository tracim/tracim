import React from 'react'
import { withTranslation } from 'react-i18next'
import { Checkbox } from 'tracim_frontend_lib'

const FolderAdvanced = props => {
  return (
    <div className='folder_advanced-content'>
      {props.isArchived &&
        <div className='folder_advanced__content__state'>
          <div className='folder_advanced__content__state__msg'>
            <i className='fa fa-fw fa-archive' />
            {props.t('This folder is archived')}
          </div>

          <button className='folder_advanced__content__state__btnrestore btn' onClick={props.onClickRestoreArchived}>
            <i className='fa fa-fw fa-archive' />
            {props.t('Restore')}
          </button>
        </div>
      }

      {props.isDeleted &&
        <div className='folder_advanced__content__state'>
          <div className='folder_advanced__content__state__msg'>
            <i className='fa fa-fw fa-trash' />
            {props.t('This folder is deleted')}
          </div>

          <button className='folder_advanced__content__state__btnrestore btn' onClick={props.onClickRestoreDeleted}>
            <i className='fa fa-fw fa-trash' />
            {props.t('Restore')}
          </button>
        </div>
      }

      <div className='formBlock folder_advanced__content'>
        <div className='formBlock__title folder_advanced__content__title'>
          {props.t('Allowed content type for this folder')}
        </div>

        <form className='formBlock__field folder_advanced__content__form'>
          {props.tracimContentTypeList.map(app =>
            <div
              className='folder_advanced__content__form__type'
              onClick={() => !props.isArchived && !props.isDeleted && props.onClickApp(app.slug)}
              key={app.slug}
            >
              <Checkbox
                name={app.label}
                checked={props.folderSubContentType.includes(app.slug)}
                onClickCheckbox={() => props.onClickApp(app.slug)}
                styleLabel={{ margin: '0 8px 0 0' }}
                styleCheck={{ top: '-5px' }}
                disabled={props.isArchived || props.isDeleted}
              />

              <i
                className={`folder_advanced__content__form__type__icon fa fa-fw fa-${app.fa_icon}`}
                style={{ color: app.hexcolor }}
              />

              <div className='folder_advanced__content__form__type__label'>
                {props.t(app.label)}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default withTranslation()(FolderAdvanced)
