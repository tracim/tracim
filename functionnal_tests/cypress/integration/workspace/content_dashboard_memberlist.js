describe('content :: workspace > dashboard', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visit('/ui/workspaces/1/dashboard')
  })
  it('dashboard__workspaceInfo > memberlist', function () {
    cy.get('.activityList__item')
    cy.get('.memberlist').scrollIntoView()
    cy.get('.memberlist .memberlist__list').should('be.visible')
    cy.get('.memberlist .memberlist__wrapper').should('be.visible')
    cy.get('.memberlist .memberlist__list.withAddBtn').should('be.visible')
    cy.get('.memberlist .memberlist__btnadd').should('be.visible')
    cy.get('.memberlist .memberlist__list__item').should('be.visible')
    cy.get('.memberlist .memberlist__list__item__info__firstColumn__name').should('be.visible')
    cy.get('.memberlist .memberlist__list__item__avatar').should('be.visible')
    cy.get('.memberlist .memberlist__list__item__info').should('be.visible')
    cy.get('.memberlist .memberlist__list__item__info__role').should('be.visible')
    cy.get('.memberlist').scrollIntoView({ offset: { bottom: 0 } })
    cy.get('.memberlist .memberlist__list__item__delete').should('be.visible')
    cy.get('.memberlist .fa-trash-alt').should('be.visible')
    cy.get('.profileNavigation :first')
      .click()
    cy.get('.profile__content__page')
      .should('be.visible')
  })
})
