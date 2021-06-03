import React from 'react'
import { translate } from 'react-i18next'
import { Checkbox } from '../Input/Checkbox.jsx'
import PropTypes from 'prop-types'

require('./TagList.styl')

export const Tag = props => {
    return (
        <div className="taglist__list__item__info__firstColumn__name">
            <div className='taglist__list__item_avatar'>    
                <Checkbox
                    onClickCheckbox={() => props.onClickCheckbox}
                    checked={props.checked}
                />
            </div>

            <div className='taglist__list__item__info'>
                <div className='taglist__list__item__info__firstColumn'>
                    <span
                        className='taglist__list__item__info__firstColumn__name'
                        title={props.name}
                    >
                        {props.name}
                    </span>

                    <div
                        className='taglist__list__item__info__firstColumn__username'
                        title={props.description}
                    >
                        {props.description}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default translate()(Tag)

Tag.defaultProps = {
    checked: false,
    onClickCheckbox: () => { }
}

Tag.propTypes = {
    checked: PropTypes.bool,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    onClick: PropTypes.func
}