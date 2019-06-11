import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

const threadTitle = 'ThreadForResearch'
const researchInput = '[data-cy=research__text]'
const contentThreadGetter = formatTag({selectorName: s.CONTENT_IN_RESEARCH, attrs: {title: threadTitle}})

let workspaceId

describe('Searching keywords', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createThread(threadTitle, workspaceId)
    })
    cy.logout()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({pageName: PAGES.HOME})
  })

  describe('and clicking in the first result', () => {
    it('Should redirect to the content page', () => {
      cy.get(researchInput).type(threadTitle).type('{enter}')

      cy.get(contentThreadGetter).click()

      cy.url().should('include', `/workspaces/${workspaceId}/contents/thread/`)
      cy.get('.thread__contentpage__header__title').contains(threadTitle).should('be.visible')
    })
  })
})
