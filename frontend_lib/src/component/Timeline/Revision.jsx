import Avatar from '../Avatar/Avatar.jsx'
import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import { revisionTypeList } from '../../helper.js'
import i18n from '../../i18n.js'
import { Trans } from 'react-i18next'

// require('./Revision.styl') // see https://github.com/tracim/tracim/issues/1156

const RevisionLabel = props => {
  const label = (type, status) => {
    if (type === 'status-update') {
      return props.revisionType.label(status.label)
    }
    return props.revisionType.label
  }

  return (
    <span className='revision__data' data-cy={`revision_data_${props.number}`}>
      <span className='revision__data__nb'>{props.number}</span>
      <i className={`fa fa-fw fa-${props.revisionType.faIcon} revision__data__icon`} style={{color: props.customColor}} />
      <Avatar
        width={'22px'}
        publicName={props.authorPublicName}
        style={{display: 'inline-block', marginRight: '5px', title: props.authorPublicName}}
      />
      <span className='revision__data__label'>{label(props.revisionType.id, props.status)}</span>
      <span className='revision__data__created'>{props.createdDistance}</span>
    </span>
  )
}

const Revision = props => {
  const revisionType = revisionTypeList.find(r => r.id === props.revisionType) || {id: '', faIcon: '', label: ''}
  return (
    <li
      className={classnames(`${props.customClass}__messagelist__version`, 'revision')}
      onClick={props.allowClickOnRevision ? props.onClickRevision : () => {}}
      style={{
        cursor: props.allowClickOnRevision ? 'pointer' : 'auto',
        ...(props.allowClickOnRevision
          ? {
            ':hover': {
              backgroundColor: color(props.customColor).lighten(0.60).hexString()
            }
          }
          : {}
        )
      }}
    >
      <RevisionLabel
        number={props.number}
        revisionType={revisionType}
        customColor={props.customColor}
        authorPublicName={props.authorPublicName}
        data={props.data}
        createdDistance={props.createdDistance}
        status={props.status}
      />
    </li>

  )
}

export default translate()(Radium(Revision))
