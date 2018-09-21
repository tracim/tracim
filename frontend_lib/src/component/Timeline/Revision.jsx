import React from 'react'
import classnames from 'classnames'
import Radium from 'radium'
import { libRevisionTypeList } from '../../helper.js'

const Revision = props => (
  <li className={classnames(`${props.customClass}__messagelist__version`, 'timeline__body__messagelist__version')}>
    <div className={classnames(`${props.customClass}__messagelist__version__action`, 'timeline__body__messagelist__version__action')}>
      <button
        type='button'
        className={classnames(`${props.customClass}__messagelist__version__action__btn`, 'timeline__body__messagelist__version__action__btn btn outlineTextBtn')}
        onClick={props.onClickRevision}
        style={{
          borderColor: props.customColor,
          color: '#252525',
          ':hover': {
            backgroundColor: props.customColor,
            color: '#fdfdfd'
          }
        }}
      >
        <i className='fa fa-code-fork' style={{color: '#252525'}} />
        version {props.number}
      </button>

      {(() => {
        const revisionType = libRevisionTypeList(props.lang).find(r => r.id === props.revisionType) || {id: '', faIcon: '', label: ''}
        return (
          <div
            className={classnames(`${props.customClass}__messagelist__version__action__icon`, 'timeline__body__messagelist__version__action__icon')}
            title={revisionType.label}
            style={{color: props.customColor}}
          >
            <i className={`fa fa-fw fa-${revisionType.faIcon}`} />
          </div>
        )
      })()}
    </div>


    <div className={classnames(`${props.customClass}__messagelist__version__date`, 'timeline__body__messagelist__version__date')}>
      {props.createdAt}
    </div>
  </li>
)

export default Radium(Revision)
