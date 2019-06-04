const htmlDocTitle = 'HtmlDocForResearch'
const threadTitle = 'ThreadForResearch'
const fileTitle = 'FileForResearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const researchInput = '.research > [data-cy=research__text]'
const researchButton = '.research > [data-cy=research__btn]'
const contentName= '[data-cy=research__content] [data-cy=content__item] > [data-cy=content__name]'

let workspaceId

describe('Research page', () => {
  before(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('users')
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createHtmlDocument(htmlDocTitle, workspaceId)
        cy.createThread(threadTitle, workspaceId)
        cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
      })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/ui')
  })

  describe('Typing FileForResearch in the input, validating and clicking in the first result', () => {
    it('Should redirect to the content page', () => {
      cy.get(researchInput).type(fileTitle)
      cy.get(researchButton).click()

      cy.get(contentName).contains(fileTitle).click()

      cy.url().should('include', `/workspaces/${workspaceId}/contents/file/`)
      cy.get('.file__header__title').contains(fileTitle).should('be.visible')
    })
  })
})
