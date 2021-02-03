const WORKSPACE_URL = '/ui/workspaces/1/contents'

describe('navigate :: workspace > create_new > html-document', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit(WORKSPACE_URL)
  })
  it('Checks if creation popup opens and closes', function () {
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.get('.show .fa-file-alt').should('be.visible').click()
    const title = 'document1'
    cy.get('.cardPopup__container').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__close').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy
      .get('.cardPopup__container .createcontent .createcontent__form__input')
      .type(title)
    cy
      .get('.cardPopup__container .createcontent .createcontent__form__input')
      .should('have.attr', 'value', title)
      .should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .cardPopup__close').click()
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
  })
})
