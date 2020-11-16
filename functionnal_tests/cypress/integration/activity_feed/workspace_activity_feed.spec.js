import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'
import defaultAdmin from '../../fixtures/defaultAdmin.json'
import baseUser from '../../fixtures/baseUser.json'

describe("The space activity feed page", () => {
  const workspaceId = 1

  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('Pagination', () => {
    beforeEach(() => {
      for (let i = 0; i < 20; ++i) {
        cy.createFile('artikodin.png', 'image/png', `png_exemple${i}.png`, workspaceId)
      }
      cy.visitPage({ pageName: PAGES.ACTIVITY_FEED, params: { workspaceId }, waitForTlm: true })
    })
    it('should display a "Show more" button when more than 15 activities exist', () => {
      cy.get('[data-cy=activity_feed__item]').should('have.length.gte', 15)
      cy.get('[data-cy=activity_feed__more]').click()
      cy.get('[data-cy=activity_feed__item]').should('have.length.gte', 20)
    })
  })

  describe('List', () => {
    beforeEach(() => cy.visitPage({ pageName: PAGES.ACTIVITY_FEED, params: { workspaceId }, waitForTlm: true }))
    it('should have items', () => {
      cy.get('[data-cy=activity_feed__item]').should('have.length', 2)
    })

    it('should add an item in first position when a file is created', () => {
      cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 3)
        .first()
        .should('contain.text', 'png_exemple2')
    })

    it('should update already an existing item when a comment for its content is posted', () => {
      cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 3)
        .first()
        .should('contain.text', 'modified')
      cy.postComment(workspaceId, 1, 'A comment')
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 3)
        .first()
        .should('contain.text', 'commented')
    })

    it('should be reordered only when the "Refresh" button is pressed', () => {
      const firstContentId = 1
      cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
        .createFile('artikodin.png', 'image/png', 'png_exemple3.png', workspaceId)
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 4)
        .first()
        .should('contain.text', 'png_exemple3')
      cy.postComment(workspaceId, firstContentId, 'A comment')
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 4)
        .first()
        .should('contain.text', 'png_exemple3')
      cy.get('[data-cy=activity_feed__refresh]')
        .click()
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 4)
        .first()
        .should('contain.text', 'png_exemple2')
        .and('contain.text', 1)
    })
  })

  describe('Content item', () => {
    beforeEach(() => {
      cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
      cy.visitPage({ pageName: PAGES.ACTIVITY_FEED, params: { workspaceId }, waitForTlm: true })
    })

    it('should have a "Comment" button, clicking on it opens the content', () => {
      cy.get('[data-cy=contentActivityFooter__comment]').click()
      cy.location('pathname').should('be.equal', '/ui/workspaces/1/contents/file/1')
    })

    it('should have a title link, clicking on it opens the content', () => {
      cy.get('[data-cy=contentActivityHeader__label]').click()
      cy.location('pathname').should('be.equal', '/ui/workspaces/1/contents/file/1')
    })
  })
})
