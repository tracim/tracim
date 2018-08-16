import React from 'react'

export const UserInfo = props => {
  return (
    <div className='account__userinformation mr-5 ml-5 mb-5'>
      <div className='account__userinformation__avatar'>
        <img src={props.user.avatar} alt='avatar' />
      </div>
      <div className='account__userinformation__wrapper'>
        <div className='account__userinformation__name mb-3'>
          {`${props.user.firstname} ${props.user.lastname}`}
        </div>
        <a href={`mailto:${props.user.email}`} className='account__userinformation__email d-block primaryColorFontLighten mb-3'>
          {props.user.email}
        </a>
        <div className='account__userinformation__role mb-3'>
          {props.user.role}
        </div>
        { /* <div className='account__userinformation__job mb-3'>
          {props.user.job}
        </div>
        <a href='http://www.algoo.fr' className='account__userinformation__company primaryColorFontLighten'>
          {props.user.company}
        </a> */ }
      </div>
    </div>
  )
}

export default UserInfo
