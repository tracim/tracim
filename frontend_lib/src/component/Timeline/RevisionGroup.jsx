import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Radium from 'radium'
import { translate } from 'react-i18next'
import Revision from './Revision.jsx'
import { displayDistanceDate, formatAbsoluteDate } from '../../helper.js'

// require('./RevisionGroup.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

// INFO - CH - 2025-04-25 - Radium is incompatible with hooks. So we have to separate the Radium usage
// from the useState of RevisionGroup.
const RevisionGroupHtmlWithoutHOC = props => {
  if (props.revisionGroup.length < 2) return null

  const firstRevisionDate = formatAbsoluteDate(
    props.revisionGroup[0].created_raw,
    props.loggedUserLang,
    'P'
  )
  const lastRevisionDateTime = formatAbsoluteDate(
    props.revisionGroup[props.revisionGroup.length - 1].created_raw,
    props.loggedUserLang,
    'Pp'
  )
  const lastRevisionDate = formatAbsoluteDate(
    props.revisionGroup[props.revisionGroup.length - 1].created_raw,
    props.loggedUserLang,
    'P'
  )
  const firstAndLastRevisionDateString = [
    props.t('From'),
    firstRevisionDate,
    props.t('to'),
    lastRevisionDate
  ].join(' ')
  // const lastRevisionDistance = displayDistanceDate(lastRevisionDateTime, props.loggedUserLang)

  return (
    <div
      className='RevisionGroup'
      title={props.t('See all revisions')}
      onClick={props.onClickRevisionGroup}
      style={{
        cursor: 'pointer',
        ':hover': props.allowClickOnRevision
          ? { backgroundColor: color(props.customColor).lighten(0.60).hex() }
          : undefined
      }}
      data-cy={`revision_group_${props.revisionGroup.map(r => r.version_number).join('')}`}
    >
      <div className='RevisionGroup__icon'>
        <i className='fas fa-history' />
      </div>

      <div className='RevisionGroup__label'>
        {props.t('{{count}} Revisions', { count: props.revisionGroup.length })}
      </div>

      <div
        className='RevisionGroup__date'
        title={firstAndLastRevisionDateString}
      >
        {lastRevisionDateTime}
      </div>
    </div>
  )
}
const RevisionGroupHtml = translate()(Radium(RevisionGroupHtmlWithoutHOC))

const RevisionGroup = props => {
  const [isGrouped, setIsGrouped] = useState(true)

  if (isGrouped) {
    return (
      <RevisionGroupHtml
        allowClickOnRevision={props.allowClickOnRevision}
        customColor={props.customColor}
        revisionGroup={props.revisionGroup}
        onClickRevisionGroup={() => setIsGrouped(false)}
        loggedUserLang={props.loggedUser.lang}
      />
    )
  }

  return (
    <>
      {props.revisionGroup.map(revision => (
        <Revision
          customClass={props.customClass}
          customColor={props.customColor}
          revisionType={revision.revision_type}
          createdFormated={formatAbsoluteDate(revision.created_raw, props.loggedUser.lang)}
          createdDistance={displayDistanceDate(revision.created_raw, props.loggedUser.lang)}
          versionNumber={revision.version_number}
          status={props.availableStatusList.find(status => status.slug === revision.status)}
          authorPublicName={revision.author.public_name}
          allowClickOnRevision={props.allowClickOnRevision}
          onClickRevision={() => props.onClickRevisionBtn(revision)}
          key={`revision_${revision.revision_id}`}
        />
      ))}
    </>
  )
}

export default RevisionGroup

RevisionGroup.propTypes = {
  revisionGroup: PropTypes.array,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  loggedUser: PropTypes.object,
  availableStatusList: PropTypes.array,
  allowClickOnRevision: PropTypes.bool,
  onClickRevisionBtn: PropTypes.func
}

RevisionGroup.defaultProps = {
  revisionGroup: [],
  customClass: '',
  customColor: '',
  loggedUser: { lang: 'en' },
  availableStatusList: [],
  allowClickOnRevision: false
}
