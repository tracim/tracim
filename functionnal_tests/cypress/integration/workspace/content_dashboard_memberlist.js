describe('content :: workspace > dashbord', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visit('/ui/workspaces/1/dashboard')
  })
  it('dashboard__workspaceInfo > memberlist', function () {
    cy.get('.memberlist').scrollIntoView()
    cy.get('.memberlist .memberlist__list').should('be.visible')
    cy.get('.memberlist .memberlist__header.subTitle').should('be.visible')
    cy.get('.memberlist .memberlist__wrapper').should('be.visible')
    cy.get('.memberlist .memberlist__list.withAddBtn').should('be.visible')
    cy.get('.memberlist .memberlist__btnadd').should('be.visible')
    cy.get('.memberlist .memberlist__list__item').should('be.visible')
    cy.get('.memberlist .memberlist__list__item__avatar').should('be.visible')
    cy.get('.memberlist .memberlist__list__item__info').should('be.visible')
    cy.get('.memberlist .memberlist__list__item__info__firstLine__name').should('be.visible')
    cy.get('.memberlist .memberlist__list__item__info__firstLine__role').should('be.visible')
    cy.get('.memberlist').scrollIntoView({ offset: { bottom: 0 } })
    cy.get('.memberlist .memberlist__list__item__delete').should('be.visible')
    cy.get('.memberlist .fa-trash-o').should('be.visible')
  })
})
