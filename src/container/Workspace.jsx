import React from 'react'
import { connect } from 'react-redux'
import Folder from '../component/Workspace/Folder.jsx'
import FileItem from '../component/Workspace/FileItem.jsx'
import FileItemHeader from '../component/Workspace/FileItemHeader.jsx'
// import Chat from './Chat.jsx'
// import PageText from './PageText.jsx'
import PageWrapper from '../component/common/layout/PageWrapper.jsx'
import PageTitle from '../component/common/layout/PageTitle.jsx'
import PageContent from '../component/common/layout/PageContent.jsx'
import DropdownCreateButton from '../component/common/Input/DropdownCreateButton.jsx'

class Workspace extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activeFileType: ''
    }
  }

  render () {
    return (
      <PageWrapper customeClass='workspace'>
        <PageTitle
          parentClass='workspace__header'
          customClass='justify-content-between'
          title='Documents & Fichiers'
        >
          <DropdownCreateButton parentClass='workspace__header__btnaddworkspace' />
        </PageTitle>

        <PageContent parentClass='workspace__content'>

          <div className='workspace__content__fileandfolder'>
            <FileItemHeader />

            <FileItem
              name='Facture 57841 - Pierre Maurice - 06/06/2017'
              type='file'
              status='current'
              onClickItem={() => this.setState({activeFileType: 'file'})}
            />
            <FileItem
              name='Facture 57840 - Jean-michel Chevalier - 04/09/2017'
              type='file'
              status='validated'
              onClickItem={() => this.setState({activeFileType: 'file'})}
            />
            <FileItem
              name='Discussions à propos du nouveau système de facturation'
              type='chat'
              status='canceled'
              onClickItem={() => this.setState({activeFileType: 'chat'})}
            />

            <Folder>
              <FileItem type='file' name='Facture 57839 - Société ABC - 01/09/2017' status='current' customClass='inFolder' />
              <FileItem type='file' name='Facture 57839 - Société ABC - 01/09/2017' status='current' customClass='inFolder' />
              <FileItem type='task' name='Editer la facture pour Phillipe GIRARD' status='check' customClass='inFolder' />

              <Folder>
                <FileItem type='chat' name='Discussions à propos du nouveau système de facturation' status='nouse' customClass='inFolder' />
                <FileItem type='file' name='Facture 57537 - Claudia Martin - 14/08/2017' status='check' customClass='inFolder' />
              </Folder>
              <FileItem name='Facture 57841 - Pierre Maurice - 06/06/2017' type='file' status='current' customClass='inFolder' />
              <FileItem type='file' name='Facture 57840 - Jean-michel Chevalier - 04/09/2017' status='check' customClass='inFolder' />
              <FileItem name='Facture 57841 - Pierre Maurice - 06/06/2017' type='file' status='current' customClass='inFolder' />
              <Folder>
                <FileItem type='chat' name='Discussions à propos du nouveau système de facturation' status='nouse' customClass='inFolder' />
                <FileItem type='file' name='Facture 57537 - Claudia Martin - 14/08/2017' status='check' customClass='inFolder' />
              </Folder>
            </Folder>
          </div>

          <DropdownCreateButton customClass='workspace__content__button mb-5' />

          {/*
          <Chat visible={this.state.activeFileType === 'chat'} />
          <PageText visible={this.state.activeFileType === 'file'} />
          */}
        </PageContent>

      </PageWrapper>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(Workspace)
