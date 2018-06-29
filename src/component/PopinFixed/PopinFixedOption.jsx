import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import NewVersionBtn from '../OptionComponent/NewVersionBtn.jsx'
import EditContent from '../OptionComponent/EditContent.jsx'
import SelectStatus from '../Input/SelectStatus/SelectStatus.jsx'

const PopinFixedOption = props => {
  translate.setI18n(props.i18n ? props.i18n : i18n) // mandatory to allow Apps to overrides trad

  return (
    <div className={classnames('wsContentGeneric__option', `${props.customClass}__option`)}>
      <div className={classnames('wsContentGeneric__option__menu', `${props.customClass}__option__menu`)}>

        <NewVersionBtn onClickNewVersionBtn={props.onClickNewVersionBtn} />

        <SelectStatus
          selectedStatus={props.selectedStatus}
          availableStatus={props.availableStatus}
          onChangeStatus={props.onChangeStatus}
        />

        <EditContent
          onClickArchiveBtn={props.onClickArchive}
          onClickDeleteBtn={props.onClickDelete}
        />

      </div>
    </div>
  )
}

export default translate()(PopinFixedOption)

PopinFixedOption.propTypes = {
  selectedStatus: PropTypes.object,
  availableStatus: PropTypes.array,
  i18n: PropTypes.object, // translate resource to overrides default one,
  onClickNewVersionBtn: PropTypes.func,
  onChangeStatus: PropTypes.func
}

PopinFixedOption.defaultProps = {
  availableStatus: [],
  i18n: {},
  onClickNewVersionBtn: () => {}
}
