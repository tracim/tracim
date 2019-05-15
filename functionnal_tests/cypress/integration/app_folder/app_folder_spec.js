describe('App Folder Advanced', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy
      .fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visit(`/ui/workspaces/${workspace.workspace_id}/contents`)
    })
  })

  const createFolder = () => {
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.get('.show .subdropdown__link__folder__icon').should('be.visible').click()
    const folderTitle = 'Folder 1'
    cy.get('.cardPopup__container').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__close').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy
      .get('.cardPopup__container .createcontent .createcontent__form__input')
      .type(folderTitle)
    cy
      .get('.cardPopup__container .createcontent .createcontent__form__input')
      .should('have.attr', 'value', folderTitle)
      .should('have.attr', 'placeholder')

    cy.get('[data-cy=popup__createcontent__form__button]')
      .click()

    cy.get('.workspace__content__fileandfolder > .folder')
      .should('be.visible')
  }

  const openAppAdvancedFolder = () => {
    cy.get('.workspace__content__fileandfolder > .folder .extandedaction.dropdown')
      .should('be.visible')
      .click()

    cy.get('.workspace__content__fileandfolder > .folder .extandedaction.dropdown')
      .find('.fa.fa-pencil')
      .click()
  }

  it('should open when editing a folder', () => {
    createFolder()
    openAppAdvancedFolder()

    cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
      .should('be.visible')
  })

  it.only('should be closed when clicking on the close button', () => {
    createFolder()
    openAppAdvancedFolder()

    cy.get('[data-cy=popinFixed__header__button__close]')
      .should('be.visible')
      .click()

    cy.get('#appFeatureContainer').children().should('have.length', 0)
  })
})
