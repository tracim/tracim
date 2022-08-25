import { PAGES as p } from '../../support/urls_commands.js'

describe('Sidebar', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.HOME })
  })

  describe('when it is open', () => {
    it('should open user menu when clicking on user title', () => {
      cy.get('.sidebar__tasks__item').should('be.not.visible')
      cy.get('.sidebar__title__button').first().click()
      cy.get('.sidebar__tasks__item').should('be.visible')
    })

    it('should close space list when clicking on space title', () => {
      cy.get('[data-cy="sidebar__space__item_1"]').should('be.visible')
      cy.get('.sidebar__title__button').last().click()
      cy.get('[data-cy="sidebar__space__item_1"]').should('be.not.visible')
    })
  })

  describe('when it is closed', () => {
    beforeEach(() => {
      cy.get('.sidebar__header__expand').click()
    })

    it('should open the sidebar when clicking on user title with user menu open', () => {
      cy.get('.sidebar__footer').should('be.not.visible')
      cy.get('.sidebar__title').first().click()
      cy.get('.sidebar__footer').should('be.visible')
      cy.get('.sidebar__tasks__item').should('be.visible')
    })

    it('should open the sidebar when clicking on space title with space list open', () => {
      cy.get('.sidebar__footer').should('be.not.visible')
      cy.get('.sidebar__title').last().click()
      cy.get('.sidebar__footer').should('be.visible')
      cy.get('[data-cy="sidebar__space__item_1"]').should('be.visible')
    })
  })
})
