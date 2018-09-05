import React from 'react'
import classnames from 'classnames'
import Radium from 'radium'

const Revision = props => (
  <li className={classnames(`${props.customClass}__messagelist__version`, 'timeline__body__messagelist__version')}>
    <button
      type='button'
      className={classnames(`${props.customClass}__messagelist__version__btn`, 'timeline__body__messagelist__version__btn btn outlineTextBtn')}
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

    <div className={classnames(`${props.customClass}__messagelist__version__date`, 'timeline__body__messagelist__version__date')}>
      {props.createdAt}
    </div>
  </li>
)

export default Radium(Revision)
