import React from 'react'

import { BtnSwitch } from 'tracim_frontend_lib'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

export const OptionalFeatures = (props) => {
  return (
    <div className='formBlock workspace_advanced__optionalfunctionalities'>
      {props.appAgendaAvailable && (
        <div className='formBlock__field workspace_advanced__optionalfunctionalities__content' data-cy='agenda_enabled'>
          <BtnSwitch
            checked={props.agendaEnabled}
            onChange={props.onToggleAgendaEnabled}
            activeLabel={props.t('Agenda activated')}
            inactiveLabel={props.t('Agenda deactivated')}
            disabled={props.isLoading}
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
            disabled={props.isLoading}
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
            disabled={props.isLoading}
          />
        </div>
      )}

      <div className='formBlock__field workspace_advanced__optionalfunctionalities__content' data-cy='publication_enabled'>
        <BtnSwitch
          checked={props.publicationEnabled}
          onChange={props.onTogglePublicationEnabled}
          activeLabel={props.t('News activated')}
          inactiveLabel={props.t('News deactivated')}
          disabled={props.isLoading}
        />
      </div>
    </div>
  )
}

export default translate()(OptionalFeatures)

OptionalFeatures.propTypes = {
  isLoading: PropTypes.bool
}

OptionalFeatures.defaultProps = {
  isLoading: false
}
