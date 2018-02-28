import React, { Component } from 'react'
import imgProfil from '../img/imgProfil.png'
import BtnSwitch from '../component/common/Input/BtnSwitch.jsx'

class AccountPage extends Component {
  render () {
    return (
      <div className='account'>
        <div className='container-fluid nopadding'>
          <div className='pageTitleGeneric'>
            <div className='pageTitleGeneric__title'>
              Mon Compte
            </div>
          </div>

          <div className='account__userinformation mr-5 ml-5 mb-5'>
            <div className='account__userinformation__avatar'>
              <img src={imgProfil} alt='avatar' />
            </div>
            <div className='account__userinformation__wrapper'>
              <div className='account__userinformation__name mb-3'>
                Alexi Cauvin
              </div>
              <a href='mailto:contact@contact.fr' className='account__userinformation__email mb-3'>
                alexi.cauvin@algoo.fr
              </a>
              <div className='account__userinformation__role mb-3'>
                Utilisateur
              </div>
              <div className='account__userinformation__job mb-3'>
                Integrateur | Webdesigner
              </div>
              <a href='www.algoo.fr' className='account__userinformation__company'>
                Algoo
              </a>
            </div>
          </div>

          <div className='account__delimiter GenericDelimiter' />

          <div className='account__userpreference'>

            <nav className='account__userpreference__menu navbar d-flex align-items-start'>

              <div className='account__userpreference__menu__responsive d-lg-none'>
                <i className='fa fa-bars' />
              </div>

              <ul className='account__userpreference__menu__list nav flex-column'>

                <li className='account__userpreference__menu__list__close nav-link'>
                  <i className='fa fa-times' />
                </li>

                <li className='account__userpreference__menu__list__disabled'>Menu
                </li>
                <li className='account__userpreference__menu__list__item nav-item'>
                  <div className='account__userpreference__menu__list__item__link nav-link'>Informations Compte</div>
                </li>
                <li className='account__userpreference__menu__list__item nav-item'>
                  <div className='account__userpreference__menu__list__item__link nav-link'>Calendrier</div>
                </li>
                <li className='account__userpreference__menu__list__item nav-item'>
                  <div className='account__userpreference__menu__list__item__link nav-link'>Notifications</div>
                </li>
              </ul>
            </nav>

            <div className='account__userpreference__setting'>

              <div className='account__userpreference__setting__personaldata d-none'>
                <div className='personaldata__title subTitle ml-2 ml-sm-0'>
                  Mes informations personnelles
                </div>

                <div className='personaldata__text ml-2 ml-sm-0'>
                  Ut consectetur dolor et sunt nisi officia ut magna. Ut consectetur dolor et sunt nisi officia ut magna.
                  Ut consectetur dolor et sunt nisi officia ut magna.
                </div>

                <div className='personaldata__form'>
                  <div className='personaldata__form__title'>
                    Changer le mot de passe :
                  </div>
                  <input className='personaldata__form__txtinput form-control' type='password' placeholder='Ancien mot de passe' />
                  <input className='personaldata__form__txtinput form-control' type='password' placeholder='Nouveau mot de passe' />
                  <div className='personaldata__form__button btn btn-primary'>
                    Envoyer
                  </div>
                </div>

                <div className='personaldata__form'>
                  <div className='personaldata__form__title'>
                    Changer d'adresse mail :
                  </div>
                  <input className='personaldata__form__txtinput form-control' type='email' placeholder='Ancienne adresse mail' />
                  <input className='personaldata__form__txtinput form-control' type='email' placeholder='Nouvelle adresse mail' />
                  <div className='personaldata__form__button btn btn-primary'>
                    Envoyer
                  </div>
                </div>
              </div>

              <div className='account__userpreference__setting__calendar d-none'>

                <div className='calendar__title subTitle ml-2 ml-sm-0'>
                  Calendrier
                </div>

                <div className='calendar__text ml-2 ml-sm-0'>
                  Ut consectetur dolor et sunt nisi officia ut magna. Ut consectetur dolor et sunt nisi officia ut magna.
                  Ut consectetur dolor et sunt nisi officia ut magna.
                </div>

                <div className='calendar__title ml-2 ml-sm-0'>
                  Accèder à votre Calendrier personnel
                </div>
                <div className='calendar__link ml-2 ml-sm-0'>
                  http://algoo.trac.im/caldav/user/262.ics/
                </div>

                <div className='calendar__title ml-2 ml-sm-0'>
                  Changer de Fuseau Horaire :
                </div>

                <div className='calendar__timezone ml-2 ml-sm-0 dropdown'>
                  <button className='calendar__timezone__btn btn dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                    Fuseau Horaire
                  </button>
                  <div className='calendar__timezone__submenu dropdown-menu'>
                    <div className='calendar__timezone__submenu__item dropdown-item'> Paris GMT +1
                    </div>
                    <div className='calendar__timezone__submenu__item dropdown-item dropdown-item'> Londres GMT +0
                    </div>
                  </div>
                </div>
              </div>

              <div className='account__userpreference__setting__notification'>

                <div className='notification__title subTitle ml-2 ml-sm-0'>
                  Mes Espaces de Travail
                </div>

                <div className='notification__text ml-2 ml-sm-0'>
                  Ut consectetur dolor et sunt nisi officia ut magna. Ut consectetur dolor et sunt nisi officia ut magna.
                  Ut consectetur dolor et sunt nisi officia ut magna.
                </div>

                <div className='notification__table'>
                  <table className='table'>
                    <thead>
                      <tr>
                        <th>Espace de travail</th>
                        <th>Role</th>
                        <th>Notification</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className='notification__table__wksname'>
                            Nouvelle ligne directrice du nouveau design de Tracim v2 en date du 10 Octobre 2017
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__role'>
                            <div className='notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='notification__table__role__text d-none d-sm-flex'>
                              Gestionnaire de Contenu
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__btnswitch'>
                            <BtnSwitch />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className='notification__table__wksname'>
                            Nouvelle ligne directrice du nouveau design de Tracim v2 en date du 10 Octobre 2017
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__role'>
                            <div className='notification__table__role__icon'>
                              <i className='fa fa-eye' />
                            </div>
                            <div className='notification__table__role__text d-none d-sm-flex'>
                              Lecteur
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__btnswitch'>
                            <BtnSwitch />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className='notification__table__wksname'>
                            Nouvelle ligne directrice du nouveau design de Tracim v2 en date du 10 Octobre 2017
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__role'>
                            <div className='notification__table__role__icon'>
                              <i className='fa fa-pencil' />
                            </div>
                            <div className='notification__table__role__text d-none d-sm-flex'>
                              Contributeur
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__btnswitch'>
                            <BtnSwitch />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className='notification__table__wksname'>
                            Nouvelle ligne directrice du nouveau design de Tracim v2 en date du 10 Octobre 2017
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__role'>
                            <div className='notification__table__role__icon'>
                              <i className='fa fa-gavel' />
                            </div>
                            <div className='notification__table__role__text d-none d-sm-flex'>
                              Responsable
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__btnswitch'>
                            <BtnSwitch />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className='notification__table__wksname'>
                            Nouvelle ligne directrice du nouveau design de Tracim v2 en date du 10 Octobre 2017
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__role'>
                            <div className='notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='notification__table__role__text d-none d-sm-flex'>
                              Gestionnaire de Contenu
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__btnswitch'>
                            <BtnSwitch />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className='notification__table__wksname'>
                            Nouvelle ligne directrice du nouveau design de Tracim v2 en date du 10 Octobre 2017
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__role'>
                            <div className='notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='notification__table__role__text d-none d-sm-flex'>
                              Gestionnaire de Contenu
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__btnswitch'>
                            <BtnSwitch />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className='notification__table__wksname'>
                            Nouvelle ligne directrice du nouveau design de Tracim v2 en date du 10 Octobre 2017
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__role'>
                            <div className='notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='notification__table__role__text d-none d-sm-flex'>
                              Gestionnaire de Contenu
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='notification__table__btnswitch'>
                            <BtnSwitch />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default AccountPage
