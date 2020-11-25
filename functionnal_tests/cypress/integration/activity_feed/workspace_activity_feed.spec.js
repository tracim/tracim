import { PAGES, URLS } from '../../support/urls_commands'

describe('The space activity feed page', () => {
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
      cy.visitPage({ pageName: PAGES.ACTIVITY_FEED, params: { workspaceId }, waitForTlm: true })
    })
    it('should display a "See more" button when more than 15 activities exist', () => {
      cy.get('[data-cy=activity_feed__item]').should('have.length.gte', 15)
      cy.get('[data-cy=activity_feed__more]').click()
      cy.get('[data-cy=activity_feed__item]').should('have.length.gte', 20)
    })
  })

  describe('List', () => {
    beforeEach(() => {
      cy.visitPage({ pageName: PAGES.ACTIVITY_FEED, params: { workspaceId }, waitForTlm: true })
    })

    it('should have items', () => {
      cy.get('[data-cy=activity_feed__item]').should('have.length', 1)
    })

    it('should add an item in first position when a file is created', () => {
      cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 2)
        .first()
        .should('contain.text', 'png_exemple2')
    })

    it('should update already an existing item when a comment for its content is posted', () => {
      cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 2)
        .first()
        .should('contain.text', 'modified')
      cy.postComment(workspaceId, 1, 'A comment')
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 2)
        .first()
        .should('contain.text', 'commented')
    })

    it('should be reordered only when the "Refresh" button is pressed', () => {
      const firstContentId = 1
      cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId)
        .createFile('artikodin.png', 'image/png', 'png_exemple3.png', workspaceId)
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 3)
        .first()
        .should('contain.text', 'png_exemple3')
      cy.postComment(workspaceId, firstContentId, 'A comment')
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 3)
        .first()
        .should('contain.text', 'png_exemple3')
      cy.get('[data-cy=activity_feed__refresh]')
        .click()
      cy.get('[data-cy=activity_feed__item]')
        .should('have.length', 3)
        .first()
        .should('contain.text', 'png_exemple2')
        .and('contain.text', 1)
    })
  })

  describe('Image content item', () => {
    let fileId = null
    beforeEach(() => {
      cy.createFile('artikodin.png', 'image/png', 'png_exemple2.png', workspaceId).then(content => { fileId = content.content_id })
      cy.visitPage({ pageName: PAGES.ACTIVITY_FEED, params: { workspaceId }, waitForTlm: true })
    })

    it('should have a "Comment" button, clicking on it opens the content', () => {
      cy.get('[data-cy=contentActivityFooter__comment]').click()
      cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ workspaceId, contentType: 'file', contentId: fileId }))
    })

    it('should have a title link, clicking on it opens the content', () => {
      cy.get('[data-cy=contentActivityHeader__label]').click()
      cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ workspaceId, contentType: 'file', contentId: fileId }))
    })

    it('should have a preview, clicking on it opens the content', () => {
      cy.get('.activityFeed__preview__image > img').click()
      cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ workspaceId, contentType: 'file', contentId: fileId }))
    })
  })

  describe('Note content item', () => {
    let contentId = -1
    const smallContent = 'a small text'
    const contentName = 'Note 1'

    beforeEach(() => {
      cy.createHtmlDocument(contentName, workspaceId).then(doc => {
        contentId = doc.content_id
      })
    })

    it('should render a small note correctly', () => {
      cy.updateHtmlDocument(
        contentId,
        workspaceId,
        smallContent,
        contentName
      )

      cy.visitPage({ pageName: PAGES.ACTIVITY_FEED, params: { workspaceId }, waitForTlm: true })

      cy.get('.activityFeed__preview__overflow').should('not.exist')

      cy.get('.activityFeed__preview__html')
        .should('contain.text', smallContent)
    })

    it('should render a long note correctly', () => {
      cy.updateHtmlDocument(
        contentId,
        workspaceId,
        `<pre>
          A long text.
          This morning, I was writing Cypress tests.
          They would fail randomly, you know?
          Business as usual.
          Not only my tests were failing, but tests others wrote too.
          I was begining to feel desesperate.
          this.skip() was looking at me, amused.
          ‘I am strong though’, I said to myself.
          And then, I saw a Light.
          A Voice, out of nowhere, began to speak!
          It was starting to save me. To tell me how to fix the Holy Tests.
          ‘It is easy’, It was saying. ‘The trick is that’
          And the Voice stopped speaking. The Light went away.
          I went back to the Holy Randomly Failing Tests.
        </pre>`,
        'The Holy Tests'
      )

      cy.visitPage({ pageName: PAGES.ACTIVITY_FEED, params: { workspaceId }, waitForTlm: true })

      cy.get('.activityFeed__preview__overflow').should('be.visible')

      cy.get('.activityFeed__preview__html')
      .click()
      cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ workspaceId, contentType: 'html-document', contentId: contentId}))
    })
  })

})
