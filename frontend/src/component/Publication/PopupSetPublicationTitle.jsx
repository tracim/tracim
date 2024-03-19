import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  COLORS,
  CardPopupCreateContent
} from 'tracim_frontend_lib'


// INFO - FS - 2024-03-19 - This component is used to wrap the component CardPopupCreateContent
// in order to manage the newPublicationTitle state and improve performance in the Publications component :
// https://github.com/tracim/tracim/issues/6408
export class PopupSetPublicationTitle extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      newPublicationTitle: ''
    }
  }

  handleChangeNewPublicationTitle = e => {
    this.setState({ newPublicationTitle: e.target.value })
  }

  render () {
    const { props, state } = this
    return (
      <CardPopupCreateContent
        onClose={props.onClose}
        onValidate={() => { props.onValidate(state.newPublicationTitle) }}
        label={props.t('Labeling the news')}
        customColor={COLORS.PUBLICATION}
        faIcon='fas fa-fw fa-stream'
        contentName={state.newPublicationTitle !== undefined ? state.newPublicationTitle : ''}
        onChangeContentName={this.handleChangeNewPublicationTitle}
        btnValidateLabel={state.newPublicationTitle ? props.t('Publish') : props.t('Publish without title')}
        inputPlaceholder={props.t('News title')}
        allowEmptyTitle
      />
    )
  }
}

PopupSetPublicationTitle.propTypes = {
  onClose: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired
}

export default translate()(PopupSetPublicationTitle)
