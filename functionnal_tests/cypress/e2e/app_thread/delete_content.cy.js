import { PAGES } from '../../support/urls_commands'

let workspaceId
let threadId
const createdThreadTitle = 'createdThread'
const firstThreadTitle = 'firstThread'
const threadPopup = '.cardPopup__container .createcontent .createcontent__contentname'
const threadPopupInput = '.cardPopup__container .createcontent .createcontent__form__input'

describe('delete a thread content', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })

      cy.createThread(firstThreadTitle, workspaceId)
      cy.createThread(createdThreadTitle, workspaceId).then(thread => threadId = thread.content_id)
    })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { contentId: threadId }
    })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should show the content as deleted and remove it from the content list', function () {
    cy.get('.thread.visible .wsContentGeneric__header__title').contains(createdThreadTitle)
    cy.get('.thread.visible .thread__contentpage__header__close').click()
    cy.get('.thread.visible').should('not.exist')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')

    cy.get('.content__name').each(($elm) => {
      cy.wrap($elm).invoke('text').then((text) => {
        if (text === createdThreadTitle) {
          cy.get('.content__name').contains(createdThreadTitle).click()
          cy.get('.thread.visible').should('be.visible')
          cy.get('.thread.visible .wsContentGeneric__header__title').contains(createdThreadTitle)
          cy.get('[data-cy="dropdownContentButton"]').click()
          cy.get('[data-cy="popinListItem__delete"]').click()
          cy.get('.timeline__warning > [data-cy="promptMessage"] .promptMessage__btn').should('be.visible')
          cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
          cy.contains('.content__name', firstThreadTitle).should('be.visible')
          cy.contains('.content__name', createdThreadTitle).should('not.exist')
        }
      })
    })
  })
})
