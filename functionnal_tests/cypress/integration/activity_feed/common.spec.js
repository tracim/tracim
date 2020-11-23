import { PAGES, URLS } from '../../support/urls_commands'

const activityPages = [
  { name: 'Personal', page: PAGES.ACTIVITY_FEED, initialItemCount: 3 },
  { name: 'Space', page: PAGES.WORKSPACE_ACTIVITY_FEED, initialItemCount: 1 }
]

for (const pageTestCase of activityPages) {
  const { name, page, initialItemCount } = pageTestCase
  describe(`The ${name} activity feed page`, () => {
    let workspaceId = null
    beforeEach(() => {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.createWorkspace().then(workspace => { workspaceId = workspace.workspace_id })
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    describe('Pagination', () => {
      beforeEach(() => {
        for (let i = 0; i < 20; ++i) {
          cy.createFile('artikodin.png', 'image/png', `png_exemple${i}.png`, workspaceId)
        }
        cy.visitPage({ pageName: page, params: { workspaceId }, waitForTlm: true })
      })
      it('should display a "Show more" button when more than 15 activities exist', () => {
        cy.get('[data-cy=activityList__item]').should('have.length.gte', 15)
        cy.get('[data-cy=activityList__more]').click()
        cy.get('[data-cy=activityList__item]').should('have.length.gte', 20)
      })
    })

    describe('List', () => {
      beforeEach(() => {
        cy.visitPage({ pageName: page, params: { workspaceId }, waitForTlm: true })
      })
      it('should have items', () => {
        cy.get('[data-cy=activityList__item]').should('have.length', initialItemCount)
      })

      it('should add an item in first position when a file is created', () => {
        cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
        cy.get('[data-cy=activityList__item]')
          .should('have.length', initialItemCount + 1)
          .first()
          .should('contain.text', 'png_exemple2')
      })

      it('should update already an existing item when a comment for its content is posted', () => {
        cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
        cy.get('[data-cy=activityList__item]')
          .should('have.length', initialItemCount + 1)
          .first()
          .should('contain.text', 'modified')
        cy.postComment(workspaceId, 1, 'A comment')
        cy.get('[data-cy=activityList__item]')
          .should('have.length', initialItemCount + 1)
          .first()
          .should('contain.text', 'commented')
      })

      it('should be reordered only when the "Refresh" button is pressed', () => {
        const firstContentId = 1
        cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
          .createFile('artikodin.png', 'image/png', 'png_exemple3.png', workspaceId)
        cy.get('[data-cy=activityList__item]')
          .should('have.length', initialItemCount + 2)
          .first()
          .should('contain.text', 'png_exemple3')
        cy.postComment(workspaceId, firstContentId, 'A comment')
        cy.get('[data-cy=activityList__item]')
          .should('have.length', initialItemCount + 2)
          .first()
          .should('contain.text', 'png_exemple3')
        cy.get('[data-cy=activityList__refresh]')
          .click()
        cy.get('[data-cy=activityList__item]')
          .should('have.length', initialItemCount + 2)
          .first()
          .should('contain.text', 'png_exemple2')
          .and('contain.text', 1)
      })
    })

    describe('Content item', () => {
      let fileId = null
      beforeEach(() => {
        cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId).then(content => { fileId = content.content_id })
        cy.visitPage({ pageName: page, params: { workspaceId }, waitForTlm: true })
      })

      it('should have a "Comment" button, clicking on it opens the content', () => {
        cy.get('[data-cy=contentActivityFooter__comment]').click()
        cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ workspaceId, contentType: 'file', contentId: fileId }))
      })

      it('should have a title link, clicking on it opens the content', () => {
        cy.get('[data-cy=contentActivityHeader__label]').click()
        cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ workspaceId, contentType: 'file', contentId: fileId }))
      })
    })
  })
}
