import Avatar from '../Avatar/Avatar.jsx'
import React from 'react'
import classnames from 'classnames'
import Radium from 'radium'
import color from 'color'
import { revisionTypeList } from '../../helper.js'
import i18n from '../../i18n.js'
import { Trans } from 'react-i18next'

// require('./Revision.styl') // see https://github.com/tracim/tracim/issues/1156

const RevisionLabel = props => {
  const formatStatus = status => {
    switch (status) {
      case 'open': return i18n.t('open')
      case 'closed-deprecated': return i18n.t('deprecated')
      case 'closed-validated': return i18n.t('validated')
      case 'closed-unvalidated': return i18n.t('unvalidated')
      default:
        console.log(`Unknown revision status ${status}`)
        return ''
    }
  }

  const label = (type, status) => {
    switch (type) {
      case 'archiving':return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>Item archived</span>
        </Trans>
      )
      case 'content-comment': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>Comment</span>
        </Trans>
      )
      case 'creation': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>Item created</span>
        </Trans>
      )
      case 'deletion': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>Item deleted</span>
        </Trans>
      )
      case 'edition': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>New revision</span>
        </Trans>
      )
      case 'revision': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>New revision</span>
        </Trans>
      )
      case 'status-update': return (
        <Trans i18nKey='revisionDataLabel'>
          Status changed to {formatStatus(status)}
        </Trans>
      )
      case 'unarchiving': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>Item unarchived</span>
        </Trans>
      )
      case 'undeletion': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>Item undeleted</span>
        </Trans>
      )
      case 'move': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>Item moved</span>
        </Trans>
      )
      case 'copy': return (
        <Trans i18nKey='revisionDataLabel'>
          <span className='revision__data__label'>Item copied</span>
        </Trans>
      )
      default:
        console.log(`Unknown revision type ${type}`)
        return ''
    }
  }

  return (
    <span className='revision__data'>
      <span className='revision__data__nb'>{props.number}</span>
      <i className={`fa fa-fw fa-${props.revisionType.faIcon} revision__data__icon`} style={{color: props.customColor}} />
      <Avatar
        width={'22px'}
        publicName={props.authorPublicName}
        style={{display: 'inline-block', marginRight: '5px', title: props.authorPublicName}}
      />
      {label(props.revisionType.id, props.status)}<span className='revision__data__created'>{props.createdDistance}</span>
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

export default Radium(Revision)
