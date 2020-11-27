import { PAGES as p } from '../../support/urls_commands'

const fileTitle = 'FileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'
const fileDescription = 'newDescription'

let workspaceId, contentId

describe('In Html Document', () => {
  describe('when the user makes a change', () => {
    before(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
          .then(newContent => {
            contentId = newContent.content_id
          })
      })
    })

    beforeEach(function () {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: p.CONTENT_OPEN,
        params: { workspaceId: workspaceId, contentType: 'file', contentId: contentId }
      })
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    const languageTestCases = [
      { code: 'en', mentionContains: '@all Please' },
      { code: 'fr', mentionContains: '@tous Veuillez' },
      { code: 'pt', mentionContains: '@todos reparem' }
    ]

    for (const testCase of languageTestCases) {
      describe('clicking on "notify all" message', () => {
        it(`should send a comment with a translated @all mention (${testCase.code})`, () => {
          cy.changeLanguage(testCase.code)
          cy.get('[data-cy=popin_right_part_properties]').should('be.visible').click()
          cy.get('.fileProperties__content__detail__btndesc').should('be.visible').click()
          cy.get('textarea').type(fileDescription)
          cy.get('.fileProperties__content__detail__description__editiondesc__btn__validate').should('not.be.disabled').click()
          cy.get('[data-cy=popin_right_part_timeline]').should('not.be.disabled').click()
          cy.get('.promptMessage').should('be.visible')
          cy.get('.buttonLink').click()
          cy.contains('.comment__body__content', testCase.mentionContains).should('be.visible')
        })
      })
    }
  })
})
