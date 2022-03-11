import { PAGES as p } from '../../support/urls_commands'

const fileTitle = 'FileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'
const fileDescription = 'newDescription'

let workspaceId, contentId

describe('In File', () => {
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
      cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId } })
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    const languageTestCases = [
      { code: 'en', label: 'English', mentionContains: '@all Please', buttonLabel: 'click here', timeline: 'Timeline' },
      { code: 'fr', label: 'Français', mentionContains: '@tous Veuillez', buttonLabel: 'cliquez ici', timeline: 'Historique'  },
      { code: 'pt', label: 'Português', mentionContains: '@todos reparem', buttonLabel: 'clique aqui', timeline: 'Linha cronológica'  }
    ]

    for (const testCase of languageTestCases) {
      describe('clicking on "notify all" message', () => {
        it(`should send a comment with a translated @all mention (${testCase.code})`, () => {
          cy.get('.wsContentGeneric__content__right__content__title').should('be.visible')
          cy.changeLanguage(testCase.code)
          cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId } })
          cy.contains('.wsContentGeneric__content__right__content__title', testCase.timeline)
          cy.get('[data-cy=popin_right_part_properties]').should('be.visible').click()
          cy.get('.fileProperties__content__detail__btndesc').should('be.visible').click()
          cy.get('textarea').type(fileDescription)
          cy.get('.fileProperties__content__detail__description__editiondesc__btn__validate').should('not.be.disabled').click()
          cy.get('[data-cy=popin_right_part_timeline]').should('not.be.disabled').click()
          cy.get('.promptMessage').should('be.visible')
          cy.contains('.buttonLink', testCase.buttonLabel).click()
          cy.contains('.file__contentpage__comment__body__content__text', testCase.mentionContains).should('be.visible')
        })
      })
    }
  })
})
