import React from 'react'
import { BtnSwitch } from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

const OptionalFunctionalities = props => {
  return (
    <div className='formBlock workspace_advanced__optionalfunctionalities'>
      <div className='formBlock__title workspace_advanced__optionalfunctionalities__title'>
        {props.t('Optional functionalities')}
      </div>
      {props.appAgendaAvailable && (
        <div className='formBlock__field workspace_advanced__optionalfunctionalities__content'>
          <BtnSwitch
            checked={props.agendaEnabled}
            onChange={props.onToggleAgendaEnabled}
            activeLabel={props.t('Agenda activated')}
            inactiveLabel={props.t('Agenda deactivated')}
          />
        </div>
      )}
      {/* FIXME - G.B. - 2019-08-16 - We still don't have this features at backend
          https://github.com/tracim/tracim/issues/2215
      <div className='formBlock__field workspace_advanced__optionalfunctionalities__content'>
        <BtnSwitch
          checked={props.downloadEnabled}
          onChange={props.onToggleDownloadEnabled}
          activeLabel={props.t('Share files activated')}
          inactiveLabel={props.t('Share files deactivated')}
        />
      </div>
      <div className='formBlock__field workspace_advanced__optionalfunctionalities__content'>
        <BtnSwitch
          checked={props.uploadEnabled}
          onChange={props.onToggleUploadEnabled}
          activeLabel={props.t('Upload activated')}
          inactiveLabel={props.t('Upload deactivated')}
        />
      </div> */}
    </div>
  )
}

export default translate()(OptionalFunctionalities)
