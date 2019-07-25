import Avatar from '../Avatar/Avatar.jsx'
import React from 'react'
import classnames from 'classnames'
import { withTranslation } from 'react-i18next'
import Radium from 'radium'
import { revisionTypeList } from '../../helper.js'

// require('./Revision.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

const Revision = props => {
  const revisionType = revisionTypeList.find(r => r.id === props.revisionType) || {id: '', faIcon: '', label: ''}

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

        <i className={`fa fa-fw fa-${revisionType.faIcon} revision__data__icon`} style={{color: props.customColor}} />

        <Avatar
          width={'22px'}
          publicName={props.authorPublicName}
          style={{display: 'inline-block', marginRight: '5px', title: props.authorPublicName}}
        />

        <span className='revision__data__label'>{props.t(showLabel(revisionType, props.status))}</span>

        <span className='revision__data__created' title={props.createdFormated}>{props.createdDistance}</span>
      </span>
    </li>
  )
}

export default withTranslation()(Radium(Revision))
