const WORKSPACE_URL = '/ui/workspaces/1/contents'
const TITLE = 'document1'

describe('navigate :: workspace > create_new > custom-form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('allcontent > button', function () {
    // TODO Custom_form tests are skipped for now, tests must be enabled when the app will be activated
    // see: https://github.com/tracim/tracim/issues/2895
    this.skip()
    cy.loginAs('users')
    cy.visit(WORKSPACE_URL)
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy
      .get('#dropdownCreateBtn.workspace__header__btnaddcontent__label')
      .should('be.visible')
      .click()
    cy
      .get('.show .subdropdown__link__custom-form__icon')
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
