import React, { Component } from 'react'
import Sidebar from './Sidebar.jsx'
import imgProfil from '../img/imgProfil.png'

class Dashboard extends Component {
  render () {
    return (
      <div className='sidebarpagecontainer'>
        <Sidebar />

        <div className='dashboard'>
          <div className='container-fluid nopadding'>
            <div className='dashboard__header mb-5'>
              <div className='pageTitleGeneric dashboard__header__title d-flex align-items-center'>
                <div className='pageTitleGeneric__title dashboard__header__title__text mr-3'>
                  Dashboard
                </div>
                <div className='dashboard__header__acces'>
                  (privé)
                </div>
              </div>
              <div className='dashboard__header__advancedmode mr-3'>
                <button type='button' className='btn btn-primary'>Activé édition avancé</button>
              </div>
            </div>

            <div className='dashboard__wkswrapper'>
              <div className='dashboard__workspace'>
                <div className='dashboard__workspace__title'>
                  Nouvelle ligne directive sur le nouveau design de Tracim
                </div>

                <div className='dashboard__workspace__detail'>
                  Ut in et sit adipisicing mollit amet ut exercitation proident laborum duis occaecat eu aute qui ut.
                  Dolore veniam eu consectetur occaecat est elit dolor nulla est ut amet do reprehenderit eiusmod tempor.
                </div>
              </div>
              <div className='dashboard__userstatut'>

                <div className='dashboard__userstatut__role'>
                  <div className='dashboard__userstatut__role__text'>
                    Hi ! Alexi, vous êtes actuellement
                  </div>
                  <div className='dashboard__userstatut__role__rank'>
                    <div className='dashboard__userstatut__role__rank__icon'>
                      <i className='fa fa-graduation-cap' />
                    </div>
                    <div className='dashboard__userstatut__role__rank__rolename'>
                      Gestionnaire de projet
                    </div>
                  </div>
                </div>

                <div className='dashboard__userstatut__notification'>
                  <div className='dashboard__userstatut__notification__text'>
                    Vous êtes abonné(e) aux notifications de ce workspace
                  </div>
                  <div className='dashboard__userstatut__notification__btn btn btn-outline-primary'>
                    Changer de statut
                  </div>

                  <div className='dashboard__userstatut__notification__subscribe dropdown'>
                    <button className='dashboard__userstatut__notification__subscribe__btn btn btn-outline-primary dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                      Abonné(e)
                    </button>
                    <div className='dashboard__userstatut__notification__subscribe__submenu dropdown-menu'>
                      <div className='dashboard__userstatut__notification__subscribe__submenu__item dropdown-item'>Abonné(e)
                      </div>
                      <div className='dashboard__userstatut__notification__subscribe__submenu__item dropdown-item dropdown-item'>Non Abonné(e)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='dashboard__calltoaction'>
              <div className='dashboard__calltoaction__button btnaction thread'>
                <div className='dashboard__calltoaction__button__text'>
                  <div className='dashboard__calltoaction__button__text__icon'>
                    <i className='fa fa-comments-o' />
                  </div>
                  <div className='dashboard__calltoaction__button__text__title'>
                    Débuter une nouvelle discussion
                  </div>
                </div>
              </div>

              <div className='dashboard__calltoaction__button btnaction writefile'>
                <div className='dashboard__calltoaction__button__text'>
                  <div className='dashboard__calltoaction__button__text__icon'>
                    <i className='fa fa-file-text-o' />
                  </div>
                  <div className='dashboard__calltoaction__button__text__title'>
                    Rédiger un document
                  </div>
                </div>
              </div>

              <div className='dashboard__calltoaction__button btnaction importfile'>
                <div className='dashboard__calltoaction__button__text'>
                  <div className='dashboard__calltoaction__button__text__icon'>
                    <i className='fa fa-paperclip' />
                  </div>
                  <div className='dashboard__calltoaction__button__text__title'>
                    Importer un fichier
                  </div>
                </div>
              </div>

              <div className='dashboard__calltoaction__button btnaction visioconf'>
                <div className='dashboard__calltoaction__button__text'>
                  <div className='dashboard__calltoaction__button__text__icon'>
                    <i className='fa fa-video-camera' />
                  </div>
                  <div className='dashboard__calltoaction__button__text__title'>
                    débuter une visioconférence
                  </div>
                </div>
              </div>

              <div className='dashboard__calltoaction__button btnaction calendar'>
                <div className='dashboard__calltoaction__button__text'>
                  <div className='dashboard__calltoaction__button__text__icon'>
                    <i className='fa fa-calendar' />
                  </div>
                  <div className='dashboard__calltoaction__button__text__title'>
                    Voir le Calendrier
                  </div>
                </div>
              </div>

              <div className='dashboard__calltoaction__button btnaction explore'>
                <div className='dashboard__calltoaction__button__text'>
                  <div className='dashboard__calltoaction__button__text__icon'>
                    <i className='fa fa-folder-open-o' />
                  </div>
                  <div className='dashboard__calltoaction__button__text__title'>
                    Explorer le Workspace
                  </div>
                </div>
              </div>
            </div>

            <div className='dashboard__wksinfo'>
              <div className='dashboard__activity'>
                <div className='dashboard__activity__header'>
                  <div className='dashboard__activity__header__title subTitle'>
                    Activité récente
                  </div>

                  <div className='dashboard__activity__header__allread btn btn-outline-primary'>
                    Tout marquer comme lu
                  </div>
                </div>
                <div className='dashboard__activity__wrapper'>
                  <div className='dashboard__activity__workspace'>
                    <div className='dashboard__activity__workspace__icon'>
                      <i className='fa fa-comments-o' />
                    </div>
                    <div className='dashboard__activity__workspace__name'>
                      <span>Workspace 1</span>
                    </div>
                  </div>

                  <div className='dashboard__activity__workspace'>
                    <div className='dashboard__activity__workspace__icon'>
                      <i className='fa fa-list-ul' />
                    </div>
                    <div className='dashboard__activity__workspace__name'>
                      Workspace 2
                    </div>
                  </div>

                  <div className='dashboard__activity__workspace'>
                    <div className='dashboard__activity__workspace__icon'>
                      <i className='fa fa-list-ul' />
                    </div>
                    <div className='dashboard__activity__workspace__name'>
                      Workspace 3
                    </div>
                  </div>

                  <div className='dashboard__activity__workspace'>
                    <div className='dashboard__activity__workspace__icon'>
                      <i className='fa fa-file-text-o' />
                    </div>
                    <div className='dashboard__activity__workspace__name'>
                      <span>Workspace 4</span>
                    </div>
                  </div>

                  <div className='dashboard__activity__workspace'>
                    <div className='dashboard__activity__workspace__icon'>
                      <i className='fa fa-comments-o' />
                    </div>
                    <div className='dashboard__activity__workspace__name'>
                      <span>Workspace 5</span>
                    </div>
                  </div>

                  <div className='dashboard__activity__workspace'>
                    <div className='dashboard__activity__workspace__icon'>
                      <i className='fa fa-file-text-o' />
                    </div>
                    <div className='dashboard__activity__workspace__name'>
                      Workspace 6
                    </div>
                  </div>

                  <div className='dashboard__activity__more d-flex flex-row-reverse'>
                    <div className='dashboard__activity__more__btn btn btn-outline-primary'>
                      Voir plus
                    </div>
                  </div>
                </div>
              </div>

              <div className='dashboard__memberlist'>

                <div className='dashboard__memberlist__title subTitle'>
                  Liste des membres
                </div>

                <div className='dashboard__memberlist__wrapper'>
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

                    <li className='dashboard__memberlist__list__item'>
                      <div className='dashboard__memberlist__list__item__avatar'>
                        <img src={imgProfil} alt='avatar' />
                      </div>
                      <div className='dashboard__memberlist__list__item__info mr-auto'>
                        <div className='dashboard__memberlist__list__item__info__name'>
                          Aldwin Vinel
                        </div>
                        <div className='dashboard__memberlist__list__item__info__role'>
                          lecteur
                        </div>
                      </div>
                      <div className='dashboard__memberlist__list__item__delete d-flex justify-content-end'>
                        <i className='fa fa-trash-o' />
                      </div>
                    </li>

                    <li className='dashboard__memberlist__list__item'>
                      <div className='dashboard__memberlist__list__item__avatar'>
                        <img src={imgProfil} alt='avatar' />
                      </div>
                      <div className='dashboard__memberlist__list__item__info mr-auto'>
                        <div className='dashboard__memberlist__list__item__info__name'>
                          William Himme
                        </div>
                        <div className='dashboard__memberlist__list__item__info__role'>
                          contributeur
                        </div>
                      </div>
                      <div className='dashboard__memberlist__list__item__delete d-flex justify-content-end'>
                        <i className='fa fa-trash-o' />
                      </div>
                    </li>

                    <li className='dashboard__memberlist__list__item'>
                      <div className='dashboard__memberlist__list__item__avatar'>
                        <img src={imgProfil} alt='avatar' />
                      </div>
                      <div className='dashboard__memberlist__list__item__info mr-auto'>
                        <div className='dashboard__memberlist__list__item__info__name'>
                          Yacine Lite
                        </div>
                        <div className='dashboard__memberlist__list__item__info__role'>
                          Gestionnaire de contenu
                        </div>
                      </div>
                      <div className='dashboard__memberlist__list__item__delete d-flex justify-content-end'>
                        <i className='fa fa-trash-o' />
                      </div>
                    </li>

                    <li className='dashboard__memberlist__list__item'>
                      <div className='dashboard__memberlist__list__item__avatar'>
                        <img src={imgProfil} alt='avatar' />
                      </div>
                      <div className='dashboard__memberlist__list__item__info mr-auto'>
                        <div className='dashboard__memberlist__list__item__info__name'>
                          Yacine Lite
                        </div>
                        <div className='dashboard__memberlist__list__item__info__role'>
                          Gestionnaire de contenu
                        </div>
                      </div>
                      <div className='dashboard__memberlist__list__item__delete d-flex justify-content-end'>
                        <i className='fa fa-trash-o' />
                      </div>
                    </li>

                    <li className='dashboard__memberlist__list__item'>
                      <div className='dashboard__memberlist__list__item__avatar'>
                        <img src={imgProfil} alt='avatar' />
                      </div>
                      <div className='dashboard__memberlist__list__item__info mr-auto'>
                        <div className='dashboard__memberlist__list__item__info__name'>
                          Yacine Lite
                        </div>
                        <div className='dashboard__memberlist__list__item__info__role'>
                          Gestionnaire de contenu
                        </div>
                      </div>
                      <div className='dashboard__memberlist__list__item__delete d-flex justify-content-end'>
                        <i className='fa fa-trash-o' />
                      </div>
                    </li>

                  </ul>
                  <div className='dashboard__memberlist__btnadd'>
                    <div className='dashboard__memberlist__btnadd__button'>
                      <div className='dashboard__memberlist__btnadd__button__avatar'>
                        <div className='dashboard__memberlist__btnadd__button__avatar__icon'>
                          <i className='fa fa-plus' />
                        </div>
                      </div>
                      <div className='dashboard__memberlist__btnadd__button__text'>
                         Ajouter un membre
                      </div>
                    </div>
                  </div>

                  <form className='dashboard__memberlist__addmember'>
                    <div className='dashboard__memberlist__addmember__close d-flex justify-content-end'>
                      <i className='fa fa-times' />
                    </div>
                    <label className='dashboard__memberlist__addmember__label' htmlFor='addmember'>Indiquer le nom de l'utilisateur</label>
                    <input type='text' id='addmember' className='dashboard__memberlist__addmember__name form-control' placeholder='Name' />
                    <div className='dashboard__memberlist__addmember__role'>
                      <div className='dashboard__memberlist__addmember__role__dropdown dropdown'>
                        <button className='dashboard__memberlist__addmember__role__dropdown__button btn btn-outline-primary dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                          Rôle du membre
                        </button>
                        <div className='dashboard__memberlist__addmember__role__dropdown__submenu dropdown-menu'>
                          <div className='dashboard__memberlist__addmember__role__dropdown__submenu__item dropdown-item'>
                            <div className='dashboard__memberlist__addmember__role__dropdown__submenu__item__icon'>
                              <i className='fa fa-eye' />
                            </div>
                            Lecteur
                          </div>
                          <div className='dashboard__memberlist__addmember__role__dropdown__submenu__item dropdown-item'>
                            <div className='dashboard__memberlist__addmember__role__dropdown__submenu__item__icon'>
                              <i className='fa fa-pencil' />
                            </div>
                            contributeur
                          </div>
                          <div className='dashboard__memberlist__addmember__role__dropdown__submenu__item dropdown-item'>
                            <div className='dashboard__memberlist__addmember__role__dropdown__submenu__item__icon'>
                              <i className='fa fa-graduation-cap' />
                            </div>
                            Gestionnaire de contenu
                          </div>
                          <div className='dashboard__memberlist__addmember__role__dropdown__submenu__item dropdown-item'>
                            <div className='dashboard__memberlist__addmember__role__dropdown__submenu__item__icon'>
                              <i className='fa fa-gavel' />
                            </div>
                            Responsable
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='dashboard__memberlist__addmember__submitbtn'>
                      <button type='submit' className='btn btn-outline-primary'>Valider</button>
                    </div>
                  </form>

                </div>
              </div>
            </div>

            <div className='dashboard__moreinfo'>
              <div className='dashboard__moreinfo__webdav genericBtnInfoDashboard mr-5'>

                <div className='dashboard__moreinfo__webdav__btn genericBtnInfoDashboard__btn'>
                  <div className='dashboard__moreinfo__webdav__btn__icon genericBtnInfoDashboard__btn__icon'>
                    <i className='fa fa-windows' />
                  </div>

                  <div className='dashboard__moreinfo__webdav__btn__text genericBtnInfoDashboard__btn__text'>
                    Implémenter Tracim dans votre explorateur
                  </div>
                </div>

                <div className='dashboard__moreinfo__webdav__information genericBtnInfoDashboard__info'>
                  <div className='dashboard__moreinfo__webdav__information__text genericBtnInfoDashboard__info__text'>
                    Lorem ipsum dolore dolore laborum exercitation et deserunt ad ullamco nostrud dolore magna in proident elit amet do eu ut officia anim magna dolore adipisicing aliqua qui reprehenderit laborum labore tempor consectetur ut pariatur deserunt nostrud.
                  </div>

                  <div className='dashboard__moreinfo__webdav__information__link genericBtnInfoDashboard__info__link'>
                    http://algoo.trac.im/webdav/
                  </div>
                </div>
              </div>
              <div className='dashboard__moreinfo__calendar genericBtnInfoDashboard'>

                <div className='dashboard__moreinfo__calendar__btn genericBtnInfoDashboard__btn'>
                  <div className='dashboard__moreinfo__calendar__btn__icon genericBtnInfoDashboard__btn__icon'>
                    <i className='fa fa-calendar' />
                  </div>

                  <div className='dashboard__moreinfo__calendar__btn__text genericBtnInfoDashboard__btn__text'>
                    Calendrier de l'espace de travail
                  </div>
                </div>

                <div className='dashboard__moreinfo__calendar__information genericBtnInfoDashboard__info'>
                  <div className='dashboard__moreinfo__calendar__information__text genericBtnInfoDashboard__info__text'>
                    Lorem ipsum dolore dolore laborum exercitation et deserunt ad ullamco nostrud dolore magna in proident elit amet do eu ut officia anim magna dolore adipisicing aliqua qui reprehenderit laborum labore tempor consectetur ut pariatur deserunt nostrud.
                  </div>

                  <div className='dashboard__moreinfo__calendar__information__link genericBtnInfoDashboard__info__link'>
                    http://algoo.trac.im/calendar/
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

export default Dashboard
