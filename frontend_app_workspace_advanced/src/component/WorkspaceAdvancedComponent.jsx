import React from 'react'
import { BtnSwitch } from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

const WorkspaceAdvancedComponent = props => {
  return (
    <div className='wsContentHtmlDocument__contentpage__textnote workspaceadvanced__contentpage__textnote'>
      <div className='appdashboard__content'>
        <div className='appdashboard__content__description'>
          <div className='appdashboard__content__description__text'>
            <textarea placeholder='Description du Workspace' />
          </div>
          <div className='appdashboard__content__description__btn d-flex justify-content-end'>
            <button type='button' className='btn btn-outline-primary'>Valider</button>
          </div>
        </div>
        <div className='appdashboard__content__userlist'>
          {props.displayFormNewMember === false &&
          <div>
            <div className='appdashboard__content__userlist__title'>
              Listes des membres - modification
            </div>
            <ul className='appdashboard__content__userlist__list'>
              <li className='appdashboard__content__userlist__list__item'>
                <div className='appdashboard__content__userlist__list__item__avatar mr-3'>
                  <img src={''} alt='avatar' />
                </div>
                <div className='appdashboard__content__userlist__list__item__name mr-5'>
                  Alexi Cauvin
                </div>
                <div className='appdashboard__content__userlist__list__item__role dropdown mr-auto'>
                  <button className='btndropdown dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                    <div className='btndropdown__icon mr-3'>
                      <i className='fa fa-graduation-cap' />
                    </div>
                    <div className='btndropdown__text mr-auto'>
                      Gestionnaire de contenu
                    </div>
                  </button>
                  <div className='subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-gavel' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Responsable
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-graduation-cap' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Gestionnaire de contenu
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-pencil' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Contributeur
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-eye' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Lecteur
                      </div>
                    </div>
                  </div>
                </div>
                <div className='appdashboard__content__userlist__list__item__delete'>
                  <i className='fa fa-trash-o' />
                </div>
              </li>
              <li className='appdashboard__content__userlist__list__item'>
                <div className='appdashboard__content__userlist__list__item__avatar mr-3'>
                  <img src={''} alt='avatar' />
                </div>
                <div className='appdashboard__content__userlist__list__item__name mr-5'>
                  Alexi Cauvin
                </div>
                <div className='appdashboard__content__userlist__list__item__role dropdown mr-auto'>
                  <button className='btndropdown dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                    <div className='btndropdown__icon mr-3'>
                      <i className='fa fa-gavel' />
                    </div>
                    <div className='btndropdown__text mr-auto'>
                      Responsable
                    </div>
                  </button>
                  <div className='appdashboard__content__userlist__list__item__role__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-gavel' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Responsable
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-graduation-cap' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Gestionnaire de contenu
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-pencil' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Contributeur
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-eye' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Lecteur
                      </div>
                    </div>
                  </div>
                </div>
                <div className='appdashboard__content__userlist__list__item__delete'>
                  <i className='fa fa-trash-o' />
                </div>
              </li>
              <li className='appdashboard__content__userlist__list__item'>
                <div className='appdashboard__content__userlist__list__item__avatar mr-3'>
                  <img src={''} alt='avatar' />
                </div>
                <div className='appdashboard__content__userlist__list__item__name mr-5'>
                  Alexi Cauvin
                </div>
                <div className='appdashboard__content__userlist__list__item__role dropdown mr-auto'>
                  <button className='btndropdown dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                    <div className='btndropdown__icon mr-3'>
                      <i className='fa fa-eye' />
                    </div>
                    <div className='btndropdown__text mr-auto'>
                      Lecteur
                    </div>
                  </button>
                  <div className='appdashboard__content__userlist__list__item__role__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-gavel' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Responsable
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-graduation-cap' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Gestionnaire de contenu
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-pencil' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Contributeur
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-eye' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Lecteur
                      </div>
                    </div>
                  </div>
                </div>
                <div className='appdashboard__content__userlist__list__item__delete'>
                  <i className='fa fa-trash-o' />
                </div>
              </li>
              <li className='appdashboard__content__userlist__list__item'>
                <div className='appdashboard__content__userlist__list__item__avatar mr-3'>
                  <img src={''} alt='avatar' />
                </div>
                <div className='appdashboard__content__userlist__list__item__name mr-5'>
                  Alexi Cauvin
                </div>
                <div className='appdashboard__content__userlist__list__item__role dropdown mr-auto'>
                  <button className='btndropdown dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                    <div className='btndropdown__icon mr-3'>
                      <i className='fa fa-pencil' />
                    </div>
                    <div className='btndropdown__text mr-auto'>
                      Contributeur
                    </div>
                  </button>
                  <div className='appdashboard__content__userlist__list__item__role__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-gavel' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Responsable
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-graduation-cap' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Gestionnaire de contenu
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-pencil' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Contributeur
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-eye' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Lecteur
                      </div>
                    </div>
                  </div>
                </div>
                <div className='appdashboard__content__userlist__list__item__delete'>
                  <i className='fa fa-trash-o' />
                </div>
              </li>
              <li className='appdashboard__content__userlist__list__item'>
                <div className='appdashboard__content__userlist__list__item__avatar mr-3'>
                  <img src={''} alt='avatar' />
                </div>
                <div className='appdashboard__content__userlist__list__item__name mr-5'>
                  Alexi Cauvin
                </div>
                <div className='appdashboard__content__userlist__list__item__role dropdown mr-auto'>
                  <button className='btndropdown dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                    <div className='btndropdown__icon mr-3'>
                      <i className='fa fa-graduation-cap' />
                    </div>
                    <div className='btndropdown__text mr-auto'>
                      Gestionnaire de contenu
                    </div>
                  </button>
                  <div className='appdashboard__content__userlist__list__item__role__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-gavel' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Responsable
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-graduation-cap' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Gestionnaire de contenu
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-pencil' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Contributeur
                      </div>
                    </div>
                    <div className='subdropdown__item dropdown-item'>
                      <div className='subdropdown__item__icon'>
                        <i className='fa fa-eye' />
                      </div>
                      <div className='subdropdown__item__text'>
                        Lecteur
                      </div>
                    </div>
                  </div>
                </div>
                <div className='appdashboard__content__userlist__list__item__delete'>
                  <i className='fa fa-trash-o' />
                </div>
              </li>
            </ul>
            <div className='appdashboard__content__userlist__adduser'>
              <div className='appdashboard__content__userlist__adduser__button'>
                <div className='appdashboard__content__userlist__adduser__button__avatar'>
                  <div className='appdashboard__content__userlist__adduser__button__avatar__icon'>
                    <i className='fa fa-plus' />
                  </div>
                </div>
                <div
                  className='appdashboard__content__userlist__adduser__button__text'
                  onClick={props.onClickToggleForm}
                >
                  Ajouter un membre
                </div>
              </div>
            </div>
          </div>
          }

          {props.displayFormNewMember === true &&
          <form className='appdashboard__content__userlist__form'>
            <div
              className='appdashboard__content__userlist__form__close d-flex justify-content-end'
              onClick={props.onClickToggleForm}
            >
              <i className='fa fa-times' />
            </div>
            <div className='appdashboard__content__userlist__form__member'>
              <div className='appdashboard__content__userlist__form__member__name'>
                <label className='name__label' htmlFor='addmember'>Indiquer le nom ou l'email du membre</label>
                <input type='text' id='addmember' className='name__input form-control' placeholder='Nom ou Email' />
              </div>
              <div className='appdashboard__content__userlist__form__member__create'>
                <div className='create__radiobtn mr-3'>
                  <input type='radio' />
                </div>
                <div className='create__text'>
                  Créer un compte
                </div>
              </div>
            </div>
            <div className='appdashboard__content__userlist__form__role'>
              <div className='appdashboard__content__userlist__form__role__text'>
                Choisissez le rôle du membre
              </div>
              <ul className='appdashboard__content__userlist__form__role__list'>
                <li className='appdashboard__content__userlist__form__role__list__item'>
                  <div className='item__radiobtn mr-3'>
                    <input type='radio' name='role' value='responsable' />
                  </div>
                  <div className='item__text'>
                    <div className='item_text_icon mr-2'>
                      <i className='fa fa-gavel' />
                    </div>
                    <div className='item__text__name'>
                      Responsable
                    </div>
                  </div>
                </li>
                <li className='appdashboard__content__userlist__form__role__list__item'>
                  <div className='item__radiobtn mr-3'>
                    <input type='radio' name='role' value='gestionnaire' />
                  </div>
                  <div className='item__text'>
                    <div className='item_text_icon mr-2'>
                      <i className='fa fa-graduation-cap' />
                    </div>
                    <div className='item__text__name'>
                      Gestionnaire de contenu
                    </div>
                  </div>
                </li>
                <li className='appdashboard__content__userlist__form__role__list__item'>
                  <div className='item__radiobtn mr-3'>
                    <input type='radio' name='role' value='contributeur' />
                  </div>
                  <div className='item__text'>
                    <div className='item_text_icon mr-2'>
                      <i className='fa fa-pencil' />
                    </div>
                    <div className='item__text__name'>
                      Contributeur
                    </div>
                  </div>
                </li>
                <li className='appdashboard__content__userlist__form__role__list__item'>
                  <div className='item__radiobtn mr-3'>
                    <input type='radio' name='role' value='lecteur' />
                  </div>
                  <div className='item__text'>
                    <div className='item_text_icon mr-2'>
                      <i className='fa fa-eye' />
                    </div>
                    <div className='item__text__name'>
                      Lecteur
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div className='appdashboard__content__userlist__form__submitbtn'>
              <button type='submit' className='btn btn-outline-primary'>Valider</button>
            </div>
          </form>
          }
        </div>
        <div className='appdashboard__content__functionality'>
          <div className='appdashboard__content__functionality__title'>
            Liste des fonctionnalités
          </div>
          <div className='appdashboard__content__functionality__text'>
            Liste des fonctionnalités présentes sur Tracim que vous pouvez désactiver :
          </div>
          <ul className='appdashboard__content__functionality__list'>
            <li className='appdashboard__content__functionality__list__item'>
              <div className='item__text'>
                Calendrier de l'espace de travail :
              </div>
              <div className='item__btnswitch'>
                <BtnSwitch />
              </div>
            </li>
            <li className='appdashboard__content__functionality__list__item'>
              <div className='item__text'>
                Visioconférence :
              </div>
              <div className='item__btnswitch'>
                <BtnSwitch />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default translate()(WorkspaceAdvancedComponent)
