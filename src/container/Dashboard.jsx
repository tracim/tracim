import React, { Component } from 'react'
import listMemberBtn from '../img/listmemberbtn.png'
import imgProfil from '../img/imgProfil.png'

class Dashboard extends Component {
  render () {
    return (
      <div className='dashboard'>
        <div className='container-fluid nopadding'>
          <div className='pageTitleGeneric'>
            <div className='pageTitleGeneric__title dashboard__title'>
              Dashboard
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
                <div className='dashboard__userstatut__notification__btn btn btn-primary'>
                  Changer de statut
                </div>

                <div className='dashboard__userstatut__notification__subscribe dropdown'>
                  <button className='dashboard__userstatut__notification__subscribe__btn btn btn-secondary dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
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

                <div className='dashboard__activity__header__allread btn'>
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
                  <div className='dashboard__activity__more__btn btn'>
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
                    <div className='dashboard__memberlist__list__item__info'>
                      <div className='dashboard__memberlist__list__item__info__name'>
                        Jean Dupont
                      </div>
                      <div className='dashboard__memberlist__list__item__info__role'>
                        Responsable
                      </div>
                    </div>
                  </li>

                  <li className='dashboard__memberlist__list__item'>
                    <div className='dashboard__memberlist__list__item__avatar'>
                      <img src={imgProfil} alt='avatar' />
                    </div>
                    <div className='dashboard__memberlist__list__item__info'>
                      <div className='dashboard__memberlist__list__item__info__name'>
                        Aldwin Vinel
                      </div>
                      <div className='dashboard__memberlist__list__item__info__role'>
                        lecteur
                      </div>
                    </div>
                  </li>

                  <li className='dashboard__memberlist__list__item'>
                    <div className='dashboard__memberlist__list__item__avatar'>
                      <img src={imgProfil} alt='avatar' />
                    </div>
                    <div className='dashboard__memberlist__list__item__info'>
                      <div className='dashboard__memberlist__list__item__info__name'>
                        William Himme
                      </div>
                      <div className='dashboard__memberlist__list__item__info__role'>
                        contributeur
                      </div>
                    </div>
                  </li>

                  <li className='dashboard__memberlist__list__item'>
                    <div className='dashboard__memberlist__list__item__avatar'>
                      <img src={imgProfil} alt='avatar' />
                    </div>
                    <div className='dashboard__memberlist__list__item__info'>
                      <div className='dashboard__memberlist__list__item__info__name'>
                        Yacine Lite
                      </div>
                      <div className='dashboard__memberlist__list__item__info__role'>
                        Gestionnaire de contenu
                      </div>
                    </div>
                  </li>

                  <li className='dashboard__memberlist__list__item'>
                    <div className='dashboard__memberlist__list__item__avatar'>
                      <img src={imgProfil} alt='avatar' />
                    </div>
                    <div className='dashboard__memberlist__list__item__info'>
                      <div className='dashboard__memberlist__list__item__info__name'>
                        Yacine Lite
                      </div>
                      <div className='dashboard__memberlist__list__item__info__role'>
                        Gestionnaire de contenu
                      </div>
                    </div>
                  </li>

                  <li className='dashboard__memberlist__list__item'>
                    <div className='dashboard__memberlist__list__item__avatar'>
                      <img src={imgProfil} alt='avatar' />
                    </div>
                    <div className='dashboard__memberlist__list__item__info'>
                      <div className='dashboard__memberlist__list__item__info__name'>
                        Yacine Lite
                      </div>
                      <div className='dashboard__memberlist__list__item__info__role'>
                        Gestionnaire de contenu
                      </div>
                    </div>
                  </li>

                </ul>
                <div className='dashboard__memberlist__btnadd'>
                  <div className='dashboard__memberlist__btnadd__button'>
                    <div className='dashboard__memberlist__btnadd__button__avatar'>
                      <img src={listMemberBtn} alt='avatar' />
                    </div>
                    <div className='dashboard__memberlist__btnadd__button__text'>
                       Ajouter un membre
                    </div>
                  </div>
                </div>

                <form className='dashboard__memberlist__addmember'>
                  <input type='text' className='dashboard__memberlist__addmember__name form-control' placeholder='Name' />
                  <div className='dashboard__memberlist__addmember__role'>
                    <div className='dashboard__memberlist__addmember__role__dropdown dropdown'>
                      <button className='dashboard__memberlist__addmember__role__dropdown__button btn dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
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
                  <input type='submit' className='dashboard__memberlist__addmember__submitbtn' />
                </form>

              </div>
            </div>
          </div>

          <div className='dashboard__webdav genericWebdav'>

            <div className='dashboard__webdav__btn genericWebdav__btn'>
              <div className='dashboard__webdav__btn__icon genericWebdav__btn__icon'>
                <i className='fa fa-windows' />
              </div>

              <div className='dashboard__webdav__btn__text genericWebdav__btn__text'>
                Implémenter Tracim dans votre explorateur
              </div>
            </div>

            <div className='dashboard__webdav__information genericWebdav__info'>
              <div className='dashboard__webdav__information__text genericWebdav__info__text'>
                Lorem ipsum dolore dolore laborum exercitation et deserunt ad ullamco nostrud dolore magna in proident elit amet do eu ut officia anim magna dolore adipisicing aliqua qui reprehenderit laborum labore tempor consectetur ut pariatur deserunt nostrud.
              </div>

              <div className='dashboard__webdav__information__link genericWebdav__info__link'>
                http://algoo.trac.im/webdav/
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }
}

export default Dashboard
