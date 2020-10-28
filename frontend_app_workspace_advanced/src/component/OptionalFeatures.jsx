import React from 'react'
import { BtnSwitch } from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

const OptionalFeatures = props => {
  return (
    <div className='formBlock workspace_advanced__optionalfunctionalities'>
      {props.appAgendaAvailable && (
        <div className='formBlock__field workspace_advanced__optionalfunctionalities__content' data-cy='agenda_enabled'>
          <BtnSwitch
            checked={props.agendaEnabled}
            onChange={props.onToggleAgendaEnabled}
            activeLabel={props.t('Agenda activated')}
            inactiveLabel={props.t('Agenda deactivated')}
          />
        </div>
      )}

      {props.appDownloadAvailable && (
        <div className='formBlock__field workspace_advanced__optionalfunctionalities__content' data-cy='download_enabled'>
          <BtnSwitch
            checked={props.downloadEnabled}
            onChange={props.onToggleDownloadEnabled}
            activeLabel={props.t('Download activated')}
            inactiveLabel={props.t('Download deactivated')}
          />
        </div>
      )}

      {props.appUploadAvailable && (
        <div className='formBlock__field workspace_advanced__optionalfunctionalities__content' data-cy='upload_enabled'>
          <BtnSwitch
            checked={props.uploadEnabled}
            onChange={props.onToggleUploadEnabled}
            activeLabel={props.t('Upload activated')}
            inactiveLabel={props.t('Upload deactivated')}
          />
        </div>
      )}
    </div>
  )
}

export default translate()(OptionalFeatures)
