import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

const htmlDocTitle = 'HtmlDocForResearch'
const threadTitleLong = 'ThreadForResearchLong'
const threadTitle = 'ThreadForResearch'
const fileTitle = 'FileForResearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const researchInput = '[data-cy=research__text]'
const contentName= '[data-cy=content__name]'

let workspaceId

const contentHtmlDocGetter = formatTag({selectorName: s.CONTENT_IN_RESEARCH, attrs: {title: htmlDocTitle}})
const contentThreadGetter = formatTag({selectorName: s.CONTENT_IN_RESEARCH, attrs: {title: threadTitle}})
const contentFileGetter = formatTag({selectorName: s.CONTENT_IN_RESEARCH, attrs: {title: fileTitle}})
const contentThreadTitleLongGetter = formatTag({selectorName: s.CONTENT_IN_RESEARCH, attrs: {title: threadTitleLong}})

describe('Searching keywords', () => {
  before(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createHtmlDocument(htmlDocTitle, workspaceId)
        cy.createThread(threadTitle, workspaceId)
        cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
        cy.createThread(threadTitleLong, workspaceId)
      })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({pageName: PAGES.HOME})
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('that match two documents and validating', () => {
    it('Should display the results', () => {
      cy.get(researchInput).type(threadTitle).type('{enter}')

      cy.get(contentThreadGetter).should('be.visible')
      cy.get(contentThreadTitleLongGetter).should('be.visible')
    })

    it('Should not display the documents that does not match', () => {
      cy.get(contentFileGetter).should('be.not.visible')
      cy.get(contentHtmlDocGetter).should('be.not.visible')
    })

    describe('then archiving one document', () => {
      describe('and searching the same keyword and validating again', () => {
        it('Should not display the archived document', () => {
          cy.get(researchInput).type(threadTitle).type('{enter}')

          cy.get(contentThreadTitleLongGetter).click()
          cy.get('[data-cy=archive__button]').click()

          cy.get('[data-cy=displaystate]')
          cy.get(researchInput).type('{enter}')

          cy.get(contentThreadGetter).should('be.visible')
          cy.get(contentThreadTitleLongGetter).should('be.not.visible')
        })
      })
    })

    describe('then deleting one document', () => {
      describe('and searching the same keyword and validating', () => {
        it('Should not display the deleted document', () => {
          cy.get(researchInput).type(threadTitle).type('{enter}')

          cy.get(contentThreadGetter).click()
          cy.get('[data-cy=delete__button]').click()

          cy.get('[data-cy=displaystate]')
          cy.get(researchInput).type('{enter}')

          cy.get('.ResearchResult__content__empty').should('be.visible')
        })
      })
    })
  })

  describe('that does not match any documents and validating', () => {
    it('Should display the No results message', () => {
      cy.get(researchInput).type('DoesNotExist').type('{enter}')

      cy.get('.ResearchResult__content__empty').should('be.visible')
    })
  })
})
