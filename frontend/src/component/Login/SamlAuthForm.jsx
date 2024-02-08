import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'

require('./SamlAuthForm.styl')

const SamlAuthForm = props => {
  return (
    <div className='SamlAuthForm'>
      <div className='SamlAuthForm__authTypeList'>
        {props.idpList.map(samlIdp => (
          <a
            className='SamlAuthForm__authTypeList__item'
            href={`/saml/sso?target=${encodeURIComponent(samlIdp.identifier)}`}
            rel='noopener noreferrer'
            key={samlIdp.identifier}
          >
            <div className='SamlAuthForm__authTypeList__item__logo'>
              <img src={samlIdp.logo_url} alt={samlIdp.displayed_name} />
            </div>

            <div className='SamlAuthForm__authTypeList__item__link'>
              {samlIdp.displayed_name || `SAML IdP (${samlIdp.identifier})`}
            </div>
          </a>
        ))}
      </div>

      <Link
        className='SamlAuthForm__classicalLogin'
        onClick={props.onClickClassicLogin}
      >
        {props.t('or use classical login')}
      </Link>
    </div>
  )
}

export default translate()(SamlAuthForm)

SamlAuthForm.propsType = {
  onClickClassicLogin: PropTypes.func,
  idpList: PropTypes.array
}

SamlAuthForm.defaultProps = {
  onClickClassicLogin: () => {},
  idpList: []
}
