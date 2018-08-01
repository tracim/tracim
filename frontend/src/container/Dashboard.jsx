import React from 'react'
import { connect } from 'react-redux'
import Sidebar from './Sidebar.jsx'
import imgProfil from '../img/imgProfil.png'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import {
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'
import {
  getWorkspaceDetail,
  getWorkspaceMemberList
} from '../action-creator.async.js'
import {
  addFlashMessage,
  setWorkspaceDetail,
  setWorkspaceMemberList
} from '../action-creator.sync.js'

class Dashboard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt everytime
      displayNewMemberDashboard: false,
      displayNotifBtn: false,
      displayWebdavBtn: false,
      displayCalendarBtn: false
    }
  }

  async componentDidMount () {
    const { props, state } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json))
        break
      case 400:
      case 500:
        props.dispatch(addFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }

    const fetchWorkspaceMemberList = await props.dispatch(getWorkspaceMemberList(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceMemberList.status) {
      case 200:
        props.dispatch(setWorkspaceMemberList(fetchWorkspaceMemberList.json))
        break
      case 400:
      case 500:
        props.dispatch(addFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  handleToggleNewMemberDashboard = () => this.setState(prevState => ({
    displayNewMemberDashboard: !prevState.displayNewMemberDashboard
  }))

  handleToggleNotifBtn = () => this.setState(prevState => ({
    displayNotifBtn: !prevState.displayNotifBtn
  }))

  handleToggleWebdavBtn = () => this.setState(prevState => ({
    displayWebdavBtn: !prevState.displayWebdavBtn
  }))

  handleToggleCalendarBtn = () => this.setState(prevState => ({
    displayCalendarBtn: !prevState.displayCalendarBtn
  }))

  render () {
    const { props, state } = this

    return (
      <div className='sidebarpagecontainer'>
        <Sidebar />

        <PageWrapper customeClass='dashboard'>
          <PageTitle
            parentClass='dashboard__header'
            title={props.t('Dashboard')}
            subtitle={''}
          >
            <div className='dashboard__header__advancedmode mr-3'>
              <button type='button' className='btn btn-primary'>
                {props.t('Active advanced Dashboard')}
              </button>
            </div>
          </PageTitle>

          <PageContent>
            <div className='dashboard__workspace-wrapper'>
              <div className='dashboard__workspace'>
                <div className='dashboard__workspace__title'>
                  {props.curWs.label}
                </div>

                <div className='dashboard__workspace__detail'>
                  {props.curWs.description}
                </div>
              </div>

              <div className='dashboard__userstatut'>
                <div className='dashboard__userstatut__role'>
                  <div className='dashboard__userstatut__role__msg'>
                    {props.t(`Hi ! ${props.user.public_name}, vous êtes actuellement`)}
                  </div>

                  <div className='dashboard__userstatut__role__definition'>
                    <div className='dashboard__userstatut__role__definition__icon'>
                      <i className='fa fa-graduation-cap' />
                    </div>

                    <div className='dashboard__userstatut__role__definition__text'>
                      {(member => member ? member.role : '')(props.curWs.member.find(m => m.id === props.user.user_id))}
                    </div>
                  </div>
                </div>

                <div className='dashboard__userstatut__notification'>
                  <div className='dashboard__userstatut__notification__text'>
                    {props.t("You have subscribed to this workspace's notifications")} (nyi)
                  </div>

                  {state.displayNotifBtn
                    ? (
                      <div className='dashboard__userstatut__notification__subscribe dropdown'>
                        <button
                          className='dashboard__userstatut__notification__subscribe__btn btn btn-outline-primary dropdown-toggle'
                          type='button'
                          id='dropdownMenuButton'
                          data-toggle='dropdown'
                          aria-haspopup='true'
                          aria-expanded='false'
                        >
                          Abonné(e)
                        </button>

                        <div className='dashboard__userstatut__notification__subscribe__submenu dropdown-menu'>
                          <div className='dashboard__userstatut__notification__subscribe__submenu__item dropdown-item'>
                            {props.t('subscriber')}
                          </div>
                          <div className='dashboard__userstatut__notification__subscribe__submenu__item dropdown-item dropdown-item'>
                            {props.t('unsubscribed')}
                          </div>
                        </div>
                      </div>
                    )
                    : (
                      <div
                        className='dashboard__userstatut__notification__btn btn btn-outline-primary'
                        onClick={this.handleToggleNotifBtn}
                      >
                        {props.t('Change your status')}
                      </div>
                    )
                  }
                </div>
              </div>
            </div>

            <div className='dashboard__calltoaction justify-content-xl-center'>
              {props.contentType.map(ct =>
                <div
                  className='dashboard__calltoaction__button btnaction'
                  style={{
                    backgroundColor: ct.hexcolor,
                    ':hover': {
                      backgroundColor: color(ct.hexcolor).darken(0.15).hexString()
                    }
                  }}
                  key={ct.label}
                >
                  <div className='dashboard__calltoaction__button__text'>
                    <div className='dashboard__calltoaction__button__text__icon'>
                      <i className={`fa fa-${ct.faIcon}`} />
                    </div>
                    <div className='dashboard__calltoaction__button__text__title'>
                      {ct.creationLabel}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='dashboard__wksinfo'>
              <div className='dashboard__activity'>
                <div className='dashboard__activity__header'>
                  <div className='dashboard__activity__header__title subTitle'>
                    {this.props.t('Recent activity')}
                  </div>

                  <div className='dashboard__activity__header__allread btn btn-outline-primary'>
                    {this.props.t('Mark everything as read')}
                  </div>
                </div>
                <div className='dashboard__activity__wrapper'>

                  <div className='dashboard__activity__workspace'>
                    <div className='dashboard__activity__workspace__icon'>
                      <i className='fa fa-comments-o' />
                    </div>
                    <div className='dashboard__activity__workspace__name'>
                      <span>Développement Tracim</span>
                    </div>
                  </div>

                  <div className='dashboard__activity__more d-flex flex-row-reverse'>
                    <div className='dashboard__activity__more__btn btn btn-outline-primary'>
                      {this.props.t('See more')}
                    </div>
                  </div>
                </div>
              </div>

              <div className='dashboard__memberlist'>

                <div className='dashboard__memberlist__title subTitle'>
                  {this.props.t('Member List')}
                </div>

                <div className='dashboard__memberlist__wrapper'>
                  {this.state.displayNewMemberDashboard === false &&
                    <div>
                      <ul className='dashboard__memberlist__list'>

                        <li className='dashboard__memberlist__list__item'>
                          <div className='dashboard__memberlist__list__item__avatar'>
                            <img src={imgProfil} alt='avatar' />
                          </div>
                          <div className='dashboard__memberlist__list__item__info mr-auto'>
                            <div className='dashboard__memberlist__list__item__info__name'>
                              Jean Dupont
                            </div>
                            <div className='dashboard__memberlist__list__item__info__role'>
                              Responsable
                            </div>
                          </div>
                          <div className='dashboard__memberlist__list__item__delete d-flex justify-content-end'>
                            <i className='fa fa-trash-o' />
                          </div>
                        </li>

                      </ul>

                      <div
                        className='dashboard__memberlist__btnadd'
                        onClick={this.handleToggleNewMemberDashboard}
                      >
                        <div className='dashboard__memberlist__btnadd__button'>
                          <div className='dashboard__memberlist__btnadd__button__avatar'>
                            <div className='dashboard__memberlist__btnadd__button__avatar__icon'>
                              <i className='fa fa-plus' />
                            </div>
                          </div>
                          <div
                            className='dashboard__memberlist__btnadd__button__text'
                          >
                            {this.props.t('Add a member')}
                          </div>
                        </div>
                      </div>
                    </div>
                  }

                  {this.state.displayNewMemberDashboard === true &&
                  <form className='dashboard__memberlist__form'>
                    <div
                      className='dashboard__memberlist__form__close d-flex justify-content-end'
                    >
                      <i className='fa fa-times' onClick={this.handleToggleNewMemberDashboard} />
                    </div>

                    <div className='dashboard__memberlist__form__member'>
                      <div className='dashboard__memberlist__form__member__name'>
                        <label className='name__label' htmlFor='addmember'>
                          {this.props.t('Enter the name or email of the member')}
                        </label>
                        <input type='text' id='addmember' className='name__input form-control' placeholder='Nom ou Email' />
                      </div>

                      <div className='dashboard__memberlist__form__member__create'>
                        <div className='create__radiobtn mr-3'>
                          <input type='radio' />
                        </div>

                        <div className='create__text'>
                          {this.props.t('Create an account')}
                        </div>
                      </div>
                    </div>

                    <div className='dashboard__memberlist__form__role'>
                      <div className='dashboard__memberlist__form__role__text'>
                        {this.props.t('Choose the role of the member')}
                      </div>

                      <ul className='dashboard__memberlist__form__role__list'>

                        <li className='dashboard__memberlist__form__role__list__item'>
                          <div className='item__radiobtn mr-3'>
                            <input type='radio' name='role' value='responsable' />
                          </div>

                          <div className='item__text'>
                            <div className='item_text_icon mr-2'>
                              <i className='fa fa-gavel' />
                            </div>

                            <div className='item__text__name'>
                              {this.props.t('Supervisor')}
                            </div>
                          </div>
                        </li>

                      </ul>
                    </div>

                    <div className='dashboard__memberlist__form__submitbtn'>
                      <button className='btn btn-outline-primary'>
                        {this.props.t('Validate')}
                      </button>
                    </div>
                  </form>
                  }
                </div>
              </div>
            </div>

            <div className='dashboard__moreinfo'>
              <div className='dashboard__moreinfo__webdav genericBtnInfoDashboard'>
                <div
                  className='dashboard__moreinfo__webdav__btn genericBtnInfoDashboard__btn'
                  onClick={this.handleToggleWebdavBtn}
                >
                  <div className='dashboard__moreinfo__webdav__btn__icon genericBtnInfoDashboard__btn__icon'>
                    <i className='fa fa-windows' />
                  </div>

                  <div className='dashboard__moreinfo__webdav__btn__text genericBtnInfoDashboard__btn__text'>
                    {this.props.t('Implement Tracim in your explorer')}
                  </div>
                </div>
                {this.state.displayWebdavBtn === true &&
                <div>
                  <div className='dashboard__moreinfo__webdav__information genericBtnInfoDashboard__info'>
                    <div className='dashboard__moreinfo__webdav__information__text genericBtnInfoDashboard__info__text'>
                      {this.props.t('Find all your documents deposited online directly on your computer via the workstation, without going through the software.')}'
                    </div>

                    <div className='dashboard__moreinfo__webdav__information__link genericBtnInfoDashboard__info__link'>
                      http://algoo.trac.im/webdav/
                    </div>
                  </div>
                </div>
                }
              </div>
              <div className='dashboard__moreinfo__calendar genericBtnInfoDashboard'>
                <div className='dashboard__moreinfo__calendar__wrapperBtn'>
                  <div
                    className='dashboard__moreinfo__calendar__btn genericBtnInfoDashboard__btn'
                    onClick={this.handleToggleCalendarBtn}
                  >
                    <div className='dashboard__moreinfo__calendar__btn__icon genericBtnInfoDashboard__btn__icon'>
                      <i className='fa fa-calendar' />
                    </div>

                    <div className='dashboard__moreinfo__calendar__btn__text genericBtnInfoDashboard__btn__text'>
                      {this.props.t('Workspace Calendar')}
                    </div>
                  </div>
                </div>
                <div className='dashboard__moreinfo__calendar__wrapperText'>
                  {this.state.displayCalendarBtn === true &&
                  <div>
                    <div className='dashboard__moreinfo__calendar__information genericBtnInfoDashboard__info'>
                      <div className='dashboard__moreinfo__calendar__information__text genericBtnInfoDashboard__info__text'>
                        {this.props.t('Each workspace has its own calendar.')}
                      </div>

                      <div className='dashboard__moreinfo__calendar__information__link genericBtnInfoDashboard__info__link'>
                        http://algoo.trac.im/calendar/
                      </div>
                    </div>
                  </div>
                  }
                </div>
              </div>
            </div>
          </PageContent>
        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ user, contentType, currentWorkspace }) => ({ user, contentType, curWs: currentWorkspace })
export default connect(mapStateToProps)(translate()(Radium(Dashboard)))
