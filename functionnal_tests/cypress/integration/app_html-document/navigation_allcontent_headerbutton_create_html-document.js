const WORKSPACE_URL = '/ui/workspaces/1/contents'
const TITLE = 'document1'

describe('navigate :: workspace > create_new > html-document', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit(WORKSPACE_URL)
  })
  it('allcontent > button', function () {
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy
      .get('#dropdownCreateBtn.workspace__header__btnaddcontent__label')
      .should('be.visible')
      .click()
    cy
      .get('.show .subdropdown__link__html-document__icon')
      .should('be.visible')
      .click()

    cy.get('.cardPopup__container').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__close').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(TITLE)
    cy
      .get('.cardPopup__container .createcontent .createcontent__form__input')
      .should('have.attr', 'value', TITLE)
      .and('have.attr', 'placeholder')
    cy.get('.cardPopup__container .cardPopup__close').click()
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
  })
})
