import React from 'react'
import classnames from 'classnames'
import Radium from 'radium'
import color from 'color'

const Revision = props => (
  <li className={classnames(`${props.customClass}__messagelist__version`, 'timeline__body__messagelist__version')} >
    <button
      type='button'
      className={classnames(`${props.customClass}__messagelist__version__btn`, 'timeline__body__messagelist__version__btn btn')}
      onClick={props.onClickRevision}
      style={{
        backgroundColor: props.customColor,
        color: '#fdfdfd',
        ':hover': {
          backgroundColor: color(props.customColor).darken(0.15).hexString()
        }
      }}
    >
      <i className='fa fa-code-fork' />
      version {props.number}
    </button>

    <div className={classnames(`${props.customClass}__messagelist__version__date`, 'timeline__body__messagelist__version__date')}>
      Créé le {props.createdAt}
    </div>
  </li>
)

export default Radium(Revision)
