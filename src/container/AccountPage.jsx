import React, { Component } from 'react'
import imgProfil from '../img/imgProfil.png'

class AccountPage extends Component {
  render () {
    return (
      <div className='container-fluid nopadding'>
        <div className='account'>
          <div className='account__title ml-5'>
            Mon Compte
          </div>

          <div className='account__userinformation mr-5 ml-5 mb-5'>
            <div className='account__userinformation__avatar'>
              <img src={imgProfil} alt='avatar' />
            </div>
            <div className='account__userinformation__wrapper'>
              <div className='account__userinformation__name mb-3'>
                Alexi Cauvin
              </div>
              <div className='account__userinformation__email mb-3'>
                alexi.cauvin@algoo.fr
              </div>
              <div className='account__userinformation__role mb-3'>
                Utilisateur
              </div>
              <div className='account__userinformation__job mb-3'>
                Integrateur | Webdesigner
              </div>
              <div className='account__userinformation__company'>
                Algoo
              </div>
            </div>
          </div>

          <div className='account__delimiteur' />

          <div className='account__userpreference'>

            <nav className='account__userpreference__menu navbar d-flex align-items-start'>

              <div className='account__userpreference__menu__responsive d-lg-none'>
                <div className='account__userpreference__menu__responsive__burger' />
                <div className='account__userpreference__menu__responsive__burger' />
                <div className='account__userpreference__menu__responsive__burger' />
              </div>


              <ul className='account__userpreference__menu__list nav flex-column'>

                <div className='account__userpreference__menu__list__close nav-link'>
                  <i className='fa fa-times' />
                </div>

                <div className='account__userpreference__menu__list__disabled'>Menu
                </div>
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
                <div className='account__userpreference__setting__personaldata__title'>
                  Mes informations personnelles
                </div>

                <div className='account__userpreference__setting__personaldata__text'>
                  Ut consectetur dolor et sunt nisi officia ut magna. Ut consectetur dolor et sunt nisi officia ut magna.
                  Ut consectetur dolor et sunt nisi officia ut magna.
                </div>

                <div className='account__userpreference__setting__personaldata__changeinfo'>
                  <div className='account__userpreference__setting__personaldata__changeinfo__subtitle'>
                    Changer le mot de passe :
                  </div>
                  <input className='account__userpreference__setting__personaldata__changeinfo__txtinput' type='password' placeholder='Ancien mot de passe' />
                  <input className='account__userpreference__setting__personaldata__changeinfo__txtinput' type='password' placeholder='Nouveau mot de passe' />
                  <div className='account__userpreference__setting__personaldata__changeinfo__button btn'>
                    Envoyer
                  </div>
                </div>

                <div className='account__userpreference__setting__personaldata__changeinfo'>
                  <div className='account__userpreference__setting__personaldata__changeinfo__subtitle'>
                    Changer d'adresse mail :
                  </div>
                  <input className='account__userpreference__setting__personaldata__changeinfo__txtinput' type='email' placeholder='Ancienne adresse mail' />
                  <input className='account__userpreference__setting__personaldata__changeinfo__txtinput' type='email' placeholder='Nouvelle adresse mail' />
                  <div className='account__userpreference__setting__personaldata__changeinfo__button btn'>
                    Envoyer
                  </div>
                </div>
              </div>

              <div className='account__userpreference__setting__calendar d-none'>

                <div className='account__userpreference__setting__calendar__title'>
                  Calendrier
                </div>

                <div className='account__userpreference__setting__calendar__text'>
                  Ut consectetur dolor et sunt nisi officia ut magna. Ut consectetur dolor et sunt nisi officia ut magna.
                  Ut consectetur dolor et sunt nisi officia ut magna.
                </div>

                <div className='account__userpreference__setting__calendar__subtitle'>
                  Accèder à votre Calendrier personnel
                </div>
                <div className='account__userpreference__setting__calendar__link'>
                  http://algoo.trac.im/caldav/user/262.ics/
                </div>

                <div className='account__userpreference__setting__calendar__subtitle'>
                  Changer de Fuseau Horaire :
                </div>

                <div className='account__userpreference__setting__calendar__timezone dropdown'>
                  <button className='account__userpreference__setting__calendar__timezone__btn btn dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                    Fuseau Horaire
                  </button>
                  <div className='account__userpreference__setting__calendar__timezone__submenu dropdown-menu'>
                    <div className='account__userpreference__setting__calendar__timezone__submenu__item dropdown-item'> Paris GMT +1
                    </div>
                    <div className='account__userpreference__setting__calendar__timezone__submenu__item dropdown-item dropdown-item'> Londres GMT +0
                    </div>
                  </div>
                </div>
              </div>

              <div className='account__userpreference__setting__notification'>

                <div className='account__userpreference__setting__notification__title'>
                  Mes Espaces de Travail
                </div>

                <div className='account__userpreference__setting__notification__text'>
                  Ut consectetur dolor et sunt nisi officia ut magna. Ut consectetur dolor et sunt nisi officia ut magna.
                  Ut consectetur dolor et sunt nisi officia ut magna.
                </div>

                <div className='container-fluid'>
                  <div className='account__userpreference__setting__notification__table'>
                    <div className='account__userpreference__setting__notification__table__header'>
                      <div className='row'>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__workspace'>
                            Espace de Travail
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__role justify-content-center'>
                            Role
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__btnswitch text-right'>
                            Notifiaction
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='account__userpreference__setting__notification__table__line'>
                      <div className='row'>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__workspace'>
                            Workspace 1
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__role justify-content-sm-center'>
                            <div className='account__userpreference__setting__notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='account__userpreference__setting__notification__table__role__text'>
                              Gestionnaire de contenu
                            </div>
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__btnswitch d-flex justify-content-sm-end'>
                            <div className='account__userpreference__setting__notification__table__btnswitch__switcher'>
                              <label className='switch nomarginlabel'>
                                <input type='checkbox' />
                                <span className='slider round' />
                              </label>
                              <div className='account__userpreference__setting__notification__table__btnswitch__switcher__text'>
                                On
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='account__userpreference__setting__notification__table__line'>
                      <div className='row'>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__workspace'>
                            Workspace 1
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__role justify-content-sm-center'>
                            <div className='account__userpreference__setting__notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='account__userpreference__setting__notification__table__role__text'>
                              Gestionnaire de contenu
                            </div>
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__btnswitch d-flex justify-content-sm-end'>
                            <div className='account__userpreference__setting__notification__table__btnswitch__switcher'>
                              <label className='switch nomarginlabel'>
                                <input type='checkbox' />
                                <span className='slider round' />
                              </label>
                              <div className='account__userpreference__setting__notification__table__btnswitch__switcher__text'>
                                On
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='account__userpreference__setting__notification__table__line'>
                      <div className='row'>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__workspace'>
                            Workspace 1
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__role justify-content-sm-center'>
                            <div className='account__userpreference__setting__notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='account__userpreference__setting__notification__table__role__text'>
                              Gestionnaire de contenu
                            </div>
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__btnswitch d-flex justify-content-sm-end'>
                            <div className='account__userpreference__setting__notification__table__btnswitch__switcher'>
                              <label className='switch nomarginlabel'>
                                <input type='checkbox' />
                                <span className='slider round' />
                              </label>
                              <div className='account__userpreference__setting__notification__table__btnswitch__switcher__text'>
                                On
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='account__userpreference__setting__notification__table__line'>
                      <div className='row'>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__workspace'>
                            Workspace 1
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__role justify-content-sm-center'>
                            <div className='account__userpreference__setting__notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='account__userpreference__setting__notification__table__role__text'>
                              Gestionnaire de contenu
                            </div>
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__btnswitch d-flex justify-content-sm-end'>
                            <div className='account__userpreference__setting__notification__table__btnswitch__switcher'>
                              <label className='switch nomarginlabel'>
                                <input type='checkbox' />
                                <span className='slider round' />
                              </label>
                              <div className='account__userpreference__setting__notification__table__btnswitch__switcher__text'>
                                On
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='account__userpreference__setting__notification__table__line'>
                      <div className='row'>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__workspace'>
                            Workspace 1
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__role justify-content-sm-center'>
                            <div className='account__userpreference__setting__notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='account__userpreference__setting__notification__table__role__text'>
                              Gestionnaire de contenu
                            </div>
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__btnswitch d-flex justify-content-sm-end'>
                            <div className='account__userpreference__setting__notification__table__btnswitch__switcher'>
                              <label className='switch nomarginlabel'>
                                <input type='checkbox' />
                                <span className='slider round' />
                              </label>
                              <div className='account__userpreference__setting__notification__table__btnswitch__switcher__text'>
                                On
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='account__userpreference__setting__notification__table__line'>
                      <div className='row'>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__workspace'>
                            Workspace 1
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__role justify-content-sm-center'>
                            <div className='account__userpreference__setting__notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='account__userpreference__setting__notification__table__role__text'>
                              Gestionnaire de contenu
                            </div>
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__btnswitch d-flex justify-content-sm-end'>
                            <div className='account__userpreference__setting__notification__table__btnswitch__switcher'>
                              <label className='switch nomarginlabel'>
                                <input type='checkbox' />
                                <span className='slider round' />
                              </label>
                              <div className='account__userpreference__setting__notification__table__btnswitch__switcher__text'>
                                On
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='account__userpreference__setting__notification__table__line'>
                      <div className='row'>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__workspace'>
                            Workspace 1
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__role justify-content-sm-center'>
                            <div className='account__userpreference__setting__notification__table__role__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            <div className='account__userpreference__setting__notification__table__role__text'>
                              Gestionnaire de contenu
                            </div>
                          </div>
                        </div>
                        <div className='col-12 col-sm-4 col-md-4 col-lg-4 col-xl-4'>
                          <div className='account__userpreference__setting__notification__table__btnswitch d-flex justify-content-sm-end'>
                            <div className='account__userpreference__setting__notification__table__btnswitch__switcher'>
                              <label className='switch nomarginlabel'>
                                <input type='checkbox' />
                                <span className='slider round' />
                              </label>
                              <div className='account__userpreference__setting__notification__table__btnswitch__switcher__text'>
                                On
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
