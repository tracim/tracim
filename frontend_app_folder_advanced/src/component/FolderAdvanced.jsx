import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  Checkbox,
  IconButton,
  RefreshWarningMessage
} from 'tracim_frontend_lib'

const FolderAdvanced = props => {
  return (
    <div className='folder_advanced-content'>
      {props.isArchived && (
        <div className='folder_advanced__content__state'>
          <div className='folder_advanced__content__state__msg'>
            <i className='fas fa-fw fa-archive' />
            {props.t('This folder is archived')}
          </div>

          <IconButton
            intent='primary'
            mode='light'
            onClick={props.onClickRestoreArchived}
            icon='fas fa-archive'
            text={props.t('Restore')}
            customClass='folder_advanced__content__state__btnrestore'
          />
        </div>
      )}

      {props.isDeleted && (
        <div className='folder_advanced__content__state'>
          <div className='folder_advanced__content__state__msg'>
            <i className='far fa-fw fa-trash-alt' />
            {props.t('This folder is deleted')}
          </div>

          <IconButton
            intent='primary'
            mode='light'
            onClick={props.onClickRestoreDeleted}
            icon='fas fa-trash-alt'
            text={props.t('Restore')}
            customClass='folder_advanced__content__state__btnrestore'
          />
        </div>
      )}

      {props.isRefreshNeeded && (
        <RefreshWarningMessage
          tooltip={props.t('The content has been modified by {{author}}', { author: props.editionAuthor, interpolation: { escapeValue: false } })}
          onClickRefresh={props.onClickRefresh}
        />
      )}

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
                styleLabel={{ margin: '0 5px 0 0' }}
                styleCheck={{ top: '-5px' }}
                disabled={props.isArchived || props.isDeleted}
              />

              <i
                className={`folder_advanced__content__form__type__icon fas fa-fw fa-${app.fa_icon}`}
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

export default translate()(FolderAdvanced)

FolderAdvanced.propTypes = {
  editionAuthor: PropTypes.string,
  isRefreshNeeded: PropTypes.bool,
  onClickRefresh: PropTypes.func
}

FolderAdvanced.defaultProps = {
  editionAuthor: '',
  isRefreshNeeded: false,
  onClickRefresh: () => { }
}
