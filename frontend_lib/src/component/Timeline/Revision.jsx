import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import { revisionTypeList } from '../../helper.js'
import PropTypes from 'prop-types'

// require('./Revision.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

const Revision = props => {
  const revisionType = revisionTypeList.find(r => r.id === props.revisionType) || { id: '', faIcon: '', label: '' }

  const showLabel = (revisionType, status) => revisionType.id === 'status-update'
    ? revisionType.label(props.t(status.label))
    : revisionType.label

  return (
    <li
      className={classnames(`${props.customClass}__messagelist__version`, 'revision')}
      onClick={props.allowClickOnRevision ? props.onClickRevision : () => {}}
      style={{
        cursor: props.allowClickOnRevision ? 'pointer' : 'auto',
        ...(props.allowClickOnRevision
          ? {
            ':hover': {
              backgroundColor: color(props.customColor).lighten(0.60).hex()
            }
          }
          : {}
        )
      }}
    >
      <span className='revision__data' data-cy={`revision_data_${props.number}`}>

        <span className='revision__data__nb'>{props.number}</span>

        <i className={`fas fa-fw fa-${revisionType.faIcon} revision__data__icon`} />

        <div className='revision__data__infos'>
          <div className='d-flex'>
            <span className='revision__data__infos__label'>{props.t(showLabel(revisionType, props.status))}</span>
            <span className='revision__data__infos__created' title={props.createdFormated}>{props.createdDistance}</span>
          </div>
          <span className='revision__data__infos__author'>
            {props.t('by {{author}}', { author: props.authorPublicName, interpolation: { escapeValue: false } })}
          </span>
        </div>
      </span>
    </li>
  )
}

export default translate()(Radium(Revision))

Revision.propTypes = {
  customClass: PropTypes.string,
  allowClickOnRevision: PropTypes.bool,
  number: PropTypes.number,
  authorPublicName: PropTypes.string,
  status: PropTypes.string,
  createdFormated: PropTypes.string,
  createdDistance: PropTypes.string,
  revisionType: PropTypes.string,
  onClickRevision: PropTypes.func
}

Revision.defaultProps = {
  customClass: '',
  allowClickOnRevision: false,
  number: 0,
  authorPublicName: '',
  status: '',
  createdFormated: '',
  createdDistance: '',
  revisionType: '',
  onClickRevision: () => {}
}
