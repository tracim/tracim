import React from 'react'
import { connect } from 'react-redux'
// import HeaderTpl from '../component/HeaderTpl.jsx'
import Logo from '../component/Header/Logo.jsx'
import NavbarToggler from '../component/Header/NavbarToggler.jsx'
import MenuLinkList from '../component/Header/MenuLinkList.jsx'
// import MenuActionList from '../component/Header/MenuActionList.jsx'
import MenuActionListItemSearch from '../component/Header/MenuActionListItem/Search.jsx'
import MenuActionListItemDropdownLang from '../component/Header/MenuActionListItem/DropdownLang.jsx'
import MenuActionListItemHelp from '../component/Header/MenuActionListItem/Help.jsx'
import MenuActionListItemMenuProfil from '../component/Header/MenuActionListItem/MenuProfil.jsx'
import logoHeader from '../img/logoHeader.svg'
import flagFr from '../img/flagFr.png'
import flagEn from '../img/flagEn.png'
// import { updateUserLang } from '../action-creator.async.js'

const HeaderWrapper = props => <header><nav className='header navbar navbar-expand-md navbar-light bg-light'>{props.children}</nav></header>
const HeaderMenuRightWrapper = props => <div className='header__menu collapse navbar-collapse justify-content-end' id='navbarSupportedContent'>{props.children}</div>
const MenuActionListWrapper = props => <ul className='header__menu__rightside'>{ props.children }</ul>

class Header extends React.Component {
  // handleChangeLang = newLang => this.props.dispatch(updateUserLang(newLang))
  // handleSubmitSearch = search => console.log('search submited : ', search)

  handleClickLogo = () => {}

  handleClickFeature = () => {}
  handleClickExplore = () => {}
  handleClickAbout = () => {}

  handleChangeInput = e => this.setState({inputSearchValue: e.target.value})
  handleClickSubmit = () => {}

  handleChangeLang = langId => {}

  handleClickHelp = () => {}

  handleClickMyProfil = () => {}
  handleClickLogout = () => {}

  render () {
    // return (
    //   <HeaderTpl
    //     user={this.props.user}
    //     onChangeLang={this.handleChangeLang}
    //     onSubmitSearch={this.handleSubmitSearch}
    //   />
    // )
    const { user } = this.props
    const langList = [{ // @TODO this should come from API
      id: 'fr',
      name: 'Français',
      src: flagFr,
      active: true
    }, {
      id: 'en',
      name: 'English',
      src: flagEn,
      active: false
    }]
    // const userLogged = {
    //   name: 'MrLapin',
    //   avatar: 'https://photos-5.dropbox.com/t/2/AABmH38-9J0wawQdkSbEd757WfRA411L4h1eGtK0MLbWhA/' +
    //   '12/14775898/png/32x32/1/_/1/2/avatar.png/ELyA_woY8SUgBygH/f3VzTEnU5OWqjkWwGyHOrJA2vYQKb3j' +
    //   'S_zkvxpAJO0g?size=800x600&size_mode=3'
    // }

    return (
      <HeaderWrapper>
        <Logo logoSrc={logoHeader} onClickImg={this.handleClickLogo} />
        <NavbarToggler />

        <HeaderMenuRightWrapper>
          <MenuLinkList
            onClickFeature={this.handleClickFeature}
            onClickExplore={this.handleClickExplore}
            onClickAbout={this.handleClickAbout}
          />
          <MenuActionListWrapper>
            <MenuActionListItemSearch
              onChangeInput={this.handleChangeInput}
              onClickSubmit={this.handleClickSubmit}
            />
            <MenuActionListItemDropdownLang
              langList={langList}
              onChangeLang={this.handleChangeLang}
            />
            <MenuActionListItemHelp
              onClickHelp={this.handleClickHelp}
            />
            <MenuActionListItemMenuProfil
              user={user}
              onClickMyProfil={this.handleClickMyProfil}
              onClickLogout={this.handleClickLogout}
            />
          </MenuActionListWrapper>
        </HeaderMenuRightWrapper>
      </HeaderWrapper>
    )
  }
}
export default connect(({ user }) => ({ user }))(Header)
