describe('navigate :: workspace > create_new > thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/contents')
  })
  it('content button', function () {
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy.get('[data-cy=dropdownCreateBtn]').click()
    cy.get('.show .fa-comments').click()
    var titre1 = 'thread1'
    cy.get('.cardPopup__container').should('be.visible')
    cy.get('.cardPopup__header').should('be.visible')
    cy.get('.cardPopup__header__close').should('be.visible')
    cy.get('.cardPopup__body').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__header__title').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('.cardPopup__container .cardPopup__header__close button').click()
    cy.get('.cardPopup__container .cardPopup__header__title').should('not.exist')
  })
})
