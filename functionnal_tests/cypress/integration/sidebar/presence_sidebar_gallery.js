import { PAGES as p } from '../../support/urls_commands.js'

describe('Sidebar', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: p.HOME })
    cy.get('[data-cy=sidebar__content__navigation__workspace__item_1]').should('be.visible').click()
  })
  it('should have a link to Gallery in the hidden menu', function () {
    cy.get('.sidebar__content__navigation__item__menu').should('be.visible').click()
    cy.get('[data-cy="sidebar_subdropdown-gallery"]').should('be.visible').click()
    cy.url().should('include', '/gallery')
    cy.get('.gallery__header__title').should('be.visible')
  })
})
