describe('navigate :: create_new > workspace', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visit('/ui/workspaces/1/dashboard')
  })
  it('', function () {
    cy.get('button.sidebar__content__btnnewworkspace__btn.btn').should('be.visible')
    cy.get('button.sidebar__content__btnnewworkspace__btn.btn').click()
    cy.get('.cardPopup__container .createcontent__contentname__title').should('be.visible')
    cy.get('.cardPopup__container .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent__form__input').type('workspace1')
    cy.get('.cardPopup__container .createcontent__form__input').should('have.attr', 'value', 'workspace1')
    cy.get('.cardPopup__container .cardPopup__close').click()
    cy.get('.cardPopup__container .createcontent__contentname__title').should('not.be.visible')
  })
})
