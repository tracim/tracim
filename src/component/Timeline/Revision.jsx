import React from 'react'
import classnames from 'classnames'

const Revision = props => (
  <li className={classnames(`${props.customClass}__messagelist__version`, 'timeline__messagelist__version')} >
    <div className={classnames(`${props.customClass}__messagelist__version__btn`, 'timeline__messagelist__version__btn btn')}>
      <i className='fa fa-code-fork' />
      version {props.number}
    </div>

    <div className={classnames(`${props.customClass}__messagelist__version__date`, 'timeline__messagelist__version__date')}>
      Créer le {props.createdAt}
    </div>
  </li>
)

export default Revision
