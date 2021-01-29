import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

export const SingleChoiceList = props => {
  const radioHash = Math.random().toString(36).substring(7)
  return (
    <ul className='singleChoiceList'>
      {props.list.map(listItem =>
        <li key={listItem.slug} title={props.t(listItem.label)}>
          <label className='singleChoiceList__item' htmlFor={`${listItem.slug}_${radioHash}`}>
            <div className='singleChoiceList__item__radioButton'>
              <input
                id={`${listItem.slug}_${radioHash}`}
                type='radio'
                // INFO - GB - 2020-10-06 - The line bellow is to have a unique name for radio buttons in case this component is displayed twice on the same page
                name={`role_${radioHash}`}
                value={listItem.slug}
                checked={listItem.slug === props.currentValue}
                onChange={() => props.onChange(listItem.slug)}
              />
            </div>

            <div className='singleChoiceList__item__text'>
              <div className='singleChoiceList__item__text__icon' style={{ color: listItem.hexcolor }}>
                <i className={`fas fa-fw fa-${listItem.faIcon}`} />
              </div>

              <div className='singleChoiceList__item__text__content'>
                <div className='singleChoiceList__item__text__content__name'>
                  {props.t(listItem.label)}
                </div>

                <div className='singleChoiceList__item__text__content__description'>
                  {props.t(listItem.description)}
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
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func,
  currentValue: PropTypes.string
}

SingleChoiceList.defaultProps = {
  onChange: () => { },
  currentValue: ''
}
