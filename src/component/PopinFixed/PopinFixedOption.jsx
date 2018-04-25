import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import StatusContent from '../OptionComponent/StatusContent.jsx'
import NewVersionBtn from '../OptionComponent/NewVersionBtn.jsx'
import EditContent from '../OptionComponent/EditContent.jsx'

const PopinFixedOption = props => {
  translate.setI18n(props.i18n ? props.i18n : i18n) // mandatory to allow Apps to overrides trad

  return (
    <div className={classnames('wsContentGeneric__option', `${props.customClass}__option`)}>
      <div className={classnames('wsContentGeneric__option__menu', `${props.customClass}__option__menu`)}>

        <NewVersionBtn onClickNewVersionBtn={props.onClickNewVersionBtn} />

        <StatusContent />

        <EditContent />

      </div>
    </div>
  )
}

export default translate()(PopinFixedOption)

PopinFixedOption.propTypes = {
  i18n: PropTypes.object, // translate resource to overrides default one,
  onClickNewVersionBtn: PropTypes.func
}

PopinFixedOption.defaultProps = {
  i18n: {},
  onClickNewVersionBtn: () => {}
}
