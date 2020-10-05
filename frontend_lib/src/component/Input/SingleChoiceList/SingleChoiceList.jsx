import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

export const SingleChoiceList = props => {
  const radioHash = Math.random().toString(36).substring(7)
  return (
    <ul className='memberlist__form__role__list'>
      {props.roleList.map(r =>
        <li key={r.slug}>
          <label className='memberlist__form__role__list__item' htmlFor={`${r.slug}_${radioHash}`}>
            <div className='item__radiobtn mr-2'>
              <input
                id={`${r.slug}_${radioHash}`}
                type='radio'
                // bellow is to have a unique name for radio in case this component is displayed twice on the same page
                name={`role_${radioHash}`}
                value={r.slug}
                checked={r.slug === props.role}
                onChange={() => props.onChangeRole(r.slug)}
              />
            </div>

            <div className='item__text'>
              <div className='item__text__icon mr-1' style={{ color: r.hexcolor }}>
                <i className={`fa fa-fw fa-${r.faIcon}`} />
              </div>

              <div className='item__text__content'>
                <div className='item__text__content__name'>
                  {props.t(r.label) /* this trad key comes from frontend/helper.js, object ROLE */}
                </div>

                <div className='item__text__content__description'>
                  {props.t(r.description) /* this trad key comes from frontend/helper.js, object ROLE */}
                </div>
              </div>
            </div>
          </label>
        </li>
      )}
    </ul>
  )
}

export default translate()(SingleChoiceList)

SingleChoiceList.propTypes = {
  roleList: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChangeRole: PropTypes.func,
  role: PropTypes.string
}

SingleChoiceList.defaultProps = {
  onChangeRole: () => { },
  role: ''
}
