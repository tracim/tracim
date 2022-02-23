import { PAGES, URLS } from '../../support/urls_commands.js'

const activityPages = [
  { name: 'Personal', page: PAGES.RECENT_ACTIVITIES, initialItemCount: 3 },
  { name: 'Space', page: PAGES.WORKSPACE_RECENT_ACTIVITIES, initialItemCount: 1 }
]

const fileName2 = 'png_exemple2.png'
const fileName2WithoutExtention = 'png_exemple2'

const fileName3 = 'png_exemple3.png'
const fileName3WithoutExtention = 'png_exemple3'

const fileImage = 'artikodin.png'
const fileType = 'image/png'

for (const pageTestCase of activityPages) {
  const { name, page, initialItemCount } = pageTestCase
  describe(`The ${name} recent activities page`, () => {
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
          cy.createFile(fileImage, fileType, `png_exemple${i}.png`, workspaceId)
        }
        cy.visitPage({ pageName: page, params: { workspaceId }, waitForTlm: true })
      })

      afterEach(function () {
        cy.cancelXHR()
      })

      it('should display a "See more" button when more than 15 activities exist', () => {
        cy.get('[data-cy=activityList__item]').should('have.length.gte', 15)
        cy.get('[data-cy=activityList__more]').click()
        cy.get('[data-cy=activityList__item]').should('have.length.gte', 20)
      })
    })

    describe('List', () => {
      let firstContentId = null
      beforeEach(() => {
        cy.createFile(fileImage, fileType, fileName2, workspaceId).then(content => {
          firstContentId = content.content_id
        })
        cy.visitPage({ pageName: page, params: { workspaceId }, waitForTlm: true })
      })

      afterEach(function () {
        cy.cancelXHR()
      })

      it('should have items', () => {
        cy.get('[data-cy=activityList__item]').should('have.length', initialItemCount + 1)
      })

      it('should add an item in first position when a file is created', () => {
        cy.contains('[data-cy=activityList__item]', fileName2WithoutExtention)
        cy.get('[data-cy=activityList__item]')
          .first()
          .should('contain.text', fileName2WithoutExtention)
      })

      it('should update an already existing item when a comment for its content is posted', () => {
        cy.contains('[data-cy=activityList__item]', fileName2WithoutExtention)
        cy.postComment(workspaceId, firstContentId, 'A comment')
        cy.contains('[data-cy=activityList__item]', fileName2WithoutExtention)
          .should('contain.text', 'commented')
      })

      // FIXME - GB - 2020-12-29 - this test is unstable and it will be fixed at https://github.com/tracim/tracim/issues/3392
      it.skip('should be reordered only when the "Refresh" button is pressed', () => {
        cy.createFile(fileImage, fileType, fileName3, workspaceId).then(() => {
          cy.get('[data-cy=activityList__item]')
            .should('have.length', initialItemCount + 2)
            .first()
            .contains(fileName3WithoutExtention)

          cy.get('[data-cy=activityList__refresh]').should('not.exist')

          cy.postComment(workspaceId, firstContentId, 'A comment').then(() => {
            cy.get('[data-cy=activityList__item]')
              .first()
              .should('contain.text', fileName3WithoutExtention)

            cy.get('[data-cy=activityList__refresh]')
              .click()

            cy.get('[data-cy=activityList__item]')
              .first()
              .should('contain.text', fileName2WithoutExtention)
          })
        })
      })
    })

    describe('File Content item', () => {
      let fileId = null
      beforeEach(() => {
        cy.createFile(fileImage, fileType, fileName2, workspaceId).then(content => { fileId = content.content_id })
        cy.visitPage({ pageName: page, params: { workspaceId }, waitForTlm: true })
      })

      afterEach(function () {
        cy.cancelXHR()
      })

      it('should have a title link, clicking on it opens the content', () => {
        cy.get('[data-cy=FilenameWithExtension__label]').click()
        cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ contentId: fileId }))
      })

      it('should have a preview, clicking on it opens the content', () => {
        cy.get('.feedItem__preview__image > img').click()
        cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ contentId: fileId }))
      })

      it('should have a button on last activity, clicking on it opens a short history', () => {
        cy.get('[data-cy=feedItemTimedEvent] > .dropdown').click()
        cy.get('[data-cy=feedItemTimedEvent] .dropdownMenu').should('exist')
      })
    })

    describe('Note content item', () => {
      let contentId = -1
      const contentName = 'Note 1'
      const smallContent = 'a small text'

      beforeEach(() => {
        cy.createHtmlDocument(contentName, workspaceId).then(doc => {
          contentId = doc.content_id
        })
      })

      afterEach(function () {
        cy.cancelXHR()
      })

      it('should render a small note without the visual overflow', () => {
        cy.updateHtmlDocument(
          contentId,
          workspaceId,
          smallContent,
          contentName
        )

        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })

        cy.get('.feedItem__preview__overflow').should('not.exist')

        cy.get('.feedItem__preview__html')
          .should('contain.text', smallContent)
      })

      it('should render a long note with the visual overflow', () => {
        const longText = `<pre>
          A long text.
          This morning, I was writing Cypress tests.
          They would fail randomly, you know?
          Business as usual.
          Not only my tests were failing, but tests others wrote too.
          I was beginning to feel desperate.
          this.skip() was looking at me, amused.
          ‘I am strong though’, I said to myself.
          And then, I saw a Light.
          A Voice, out of nowhere, began to speak!
          It was starting to save me. To tell me how to fix the Holy Tests.
          ‘It is easy’, It was saying. ‘The trick is that’
          And the Voice stopped speaking. The Light went away.
          I went back to the Holy Randomly Failing Tests.
          After a few hours,
          Just when I was about to give up,
          I realized:
          My test was just missing a few text lines.
          So here I am,
          Writing the final piece.
        </pre>`.repeat(3)
        cy.updateHtmlDocument(
          contentId,
          workspaceId,
          longText,
          'The Holy Tests'
        )

        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })

        cy.get('.feedItem__preview__overflow').should('be.visible')

        cy.get('.feedItem__preview__html')
          .click()
        cy.location('pathname').should('be.equal', URLS[PAGES.CONTENT_OPEN]({ contentId: contentId }))
      })

      it('A translation button should be visible', function () {
        cy.updateHtmlDocument(
          contentId,
          workspaceId,
          smallContent,
          contentName
        )

        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
        cy.get('[data-cy=commentTranslateButton]').click()
        cy.contains('.feedItem__preview > a', 'en')
        cy.get('[data-cy=commentTranslateButton]').click()
        cy.contains('.feedItem__preview > a', smallContent)
      })

      it('a menu should allow to change the target language and translate in one click', () => {
        cy.updateHtmlDocument(
          contentId,
          workspaceId,
          smallContent,
          contentName
        )

        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
        cy.get('[data-cy=commentTranslateButton__languageMenu]').click()
        cy.get('[data-cy=commentTranslateButton__language__fr]').click()
        cy.contains('.feedItem__preview > a', 'fr')
      })
    })
  })
}
