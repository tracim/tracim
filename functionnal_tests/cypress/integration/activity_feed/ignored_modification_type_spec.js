import { PAGES } from '../../support/urls_commands.js'

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
    let contentId = null
    let commentId = null
    beforeEach(() => {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.createFile(fileImage, fileType, fileName2, 1).then(content => {
        contentId = content.content_id
        cy.postComment(1, contentId, 'A comment').then(comment => {
          commentId = comment.content_id
        })
      })
      cy.createFile(fileImage, fileType, fileName3, 1)
      cy.visitPage({ pageName: page, params: { workspaceId: 1 }, waitForTlm: true })
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    it('should ignore when a comment is modified', () => {
      cy.get('[data-cy=activityList__item]').first().should('contain.text', fileName3WithoutExtention)
      cy.putComment(1, contentId, commentId, 'Update comment')
      cy.get('[data-cy=activityList__refresh]').should('not.be.visible')
      cy.get('[data-cy=activityList__item]').first().should('contain.text', fileName3WithoutExtention)
    })

    it('should ignore when a comment is deleted', () => {
      cy.get('[data-cy=activityList__item]').first().should('contain.text', fileName3WithoutExtention)
      cy.deleteComment(1, contentId, commentId, 'Update comment')
      cy.get('[data-cy=activityList__refresh]').should('not.be.visible')
      cy.get('[data-cy=activityList__item]').first().should('contain.text', fileName3WithoutExtention)
    })
  })
}
