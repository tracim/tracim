import React from 'react'
import classnames from 'classnames'
import Radium from 'radium'
import color from 'color'
import { libRevisionTypeList } from '../../helper.js'

require('./Revision.styl')

const Revision = props => {
  const revisionType = libRevisionTypeList(props.lang).find(r => r.id === props.revisionType) || {id: '', faIcon: '', label: ''}
  return (
      <li
        className={classnames(`${props.customClass}__messagelist__version`, 'revision')}
        onClick={props.onClickRevision}
        style={{
          ':hover': {
            backgroundColor: color(props.customColor).lighten(0.60).hexString()
          }
        }}
      >
        <div className={classnames(`${props.customClass}__messagelist__version__data`, 'revision__data')}>
          <span className='revision__data__nb'>{props.number}</span>
          <i className={`fa fa-fw fa-${revisionType.faIcon} revision__data__icon`} style={{color: props.customColor}} />
          {revisionType.label}
        </div>

        <div className={classnames(`${props.customClass}__messagelist__version__date`, 'revision__date')}>
          {props.createdAt}
        </div>
      </li>
  )
}

export default Radium(Revision)
