import React from 'react'

require('./MoreInfo.styl')

export const MoreInfo = props =>
  <div className='moreinfo ml-3 ml-md-0'>
    <div className='moreinfo__webdav genericBtnInfoDashboard'>
      <div
        className='moreinfo__webdav__btn genericBtnInfoDashboard__btn primaryColorBgHover primaryColorBorderDarkenHover'
        onClick={props.onClickToggleWebdav}
      >
        <div className='moreinfo__webdav__btn__icon genericBtnInfoDashboard__btn__icon'>
          <i className='fa fa-windows' />
        </div>

        <div className='moreinfo__webdav__btn__text genericBtnInfoDashboard__btn__text'>
          {props.t('Implement Tracim in your explorer')}
        </div>
      </div>

      {props.displayWebdavBtn === true &&
      <div className='moreinfo__webdav__information genericBtnInfoDashboard__info'>
        <div className='moreinfo__webdav__information__text genericBtnInfoDashboard__info__text'>
          {props.t('Find all your documents put online directly on your computer via the workstation, without going through the software.')}'
        </div>

        <div className='moreinfo__webdav__information__link genericBtnInfoDashboard__info__link'>
          http://algoo.trac.im/webdav/
        </div>
      </div>
      }
    </div>

    <div className='moreinfo__calendar genericBtnInfoDashboard'>
      <div className='moreinfo__calendar__wrapperBtn'>
        <div
          className='moreinfo__calendar__btn genericBtnInfoDashboard__btn genericBtnInfoDashboard__btn primaryColorBgHover primaryColorBorderDarkenHover'
          onClick={props.onClickToggleCalendar}
        >
          <div className='moreinfo__calendar__btn__icon genericBtnInfoDashboard__btn__icon'>
            <i className='fa fa-calendar' />
          </div>

          <div className='moreinfo__calendar__btn__text genericBtnInfoDashboard__btn__text d-flex align-self-center'>
            {props.t('Space calendar')}
          </div>
        </div>
      </div>

      <div className='moreinfo__calendar__wrapperText'>
        {props.displayCalendarBtn === true &&
        <div className='moreinfo__calendar__information genericBtnInfoDashboard__info'>
          <div className='moreinfo__calendar__information__text genericBtnInfoDashboard__info__text'>
            {props.t('Each space has its own calendar.')}
          </div>

          <div className='moreinfo__calendar__information__link genericBtnInfoDashboard__info__link'>
            http://algoo.trac.im/calendar/
          </div>
        </div>
        }
      </div>
    </div>
  </div>

export default MoreInfo
