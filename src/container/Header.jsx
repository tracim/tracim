import React from 'react'
import { connect } from 'react-redux'
import i18n from '../i18n.js'
import Logo from '../component/Header/Logo.jsx'
import NavbarToggler from '../component/Header/NavbarToggler.jsx'
import MenuLinkList from '../component/Header/MenuLinkList.jsx'
// import MenuActionList from '../component/Header/MenuActionList.jsx'
import MenuActionListItemSearch from '../component/Header/MenuActionListItem/Search.jsx'
import MenuActionListItemDropdownLang from '../component/Header/MenuActionListItem/DropdownLang.jsx'
import MenuActionListItemHelp from '../component/Header/MenuActionListItem/Help.jsx'
import MenuActionListItemMenuProfil from '../component/Header/MenuActionListItem/MenuProfil.jsx'
import logoHeader from '../img/logoHeader.svg'
import { setLangActive } from '../action-creator.sync.js'

class Header extends React.Component {
  handleClickLogo = () => {}

  handleClickFeature = () => {}
  handleClickExplore = () => {}
  handleClickAbout = () => {}

  handleChangeInput = e => this.setState({inputSearchValue: e.target.value})
  handleClickSubmit = () => {}

  handleChangeLang = langId => {
    this.props.dispatch(setLangActive(langId))
    i18n.changeLanguage(langId)
  }

  handleClickHelp = () => {}

  handleClickLogout = () => {}

  render () {
    const { lang, user } = this.props

    return (
      <header className='header'>
        <nav className='navbar navbar-expand-md navbar-light bg-light'>
          <Logo logoSrc={logoHeader} onClickImg={this.handleClickLogo} />

          <div className='header__breadcrumb d-none d-lg-block ml-4'>
            Dev Tracim - liste des contenus
          </div>

          <NavbarToggler />

          <div className='header__menu collapse navbar-collapse justify-content-end' id='navbarSupportedContent'>

            <MenuLinkList
              onClickFeature={this.handleClickFeature}
              onClickExplore={this.handleClickExplore}
              onClickAbout={this.handleClickAbout}
            />

            <ul className='header__menu__rightside'>
              <MenuActionListItemSearch
                onChangeInput={this.handleChangeInput}
                onClickSubmit={this.handleClickSubmit}
              />
              <MenuActionListItemDropdownLang
                langList={lang}
                onChangeLang={this.handleChangeLang}
              />
              <MenuActionListItemHelp
                onClickHelp={this.handleClickHelp}
              />
              <MenuActionListItemMenuProfil
                user={user}
                onClickLogout={this.handleClickLogout}
              />
            </ul>

          </div>
        </nav>
      </header>
    )
  }
}

const mapStateToProps = ({ lang, user }) => ({ lang, user })
export default connect(mapStateToProps)(Header)
