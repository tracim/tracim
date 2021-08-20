describe('operation :: workspace > create_new > thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/dashboard')
  })

  it('dashboard > button', function () {
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents .fa-comments').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents .fa-comments').click()
    var titre1 = 'dashboard button thread'
    cy.get('.cardPopup__container .cardPopup__header__title').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('.cardPopup__container .createcontent button.createcontent__form__button').click()
    cy.get('.cardPopup__container .cardPopup__header__title').should('not.be.visible')
    cy.get('.thread.visible').should('be.visible')
    cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
    cy.get('.thread.visible .thread__contentpage__header__close').click()
    cy.get('.thread.visible').should('not.be.visible')
    cy.contains('.workspace__content__fileandfolder .content__name', titre1)
  })
})
