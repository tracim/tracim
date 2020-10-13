import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

const htmlDocTitle = 'HtmlDocForSearch'
const threadTitleLong = 'ThreadForSearchLong'
const threadTitle = 'ThreadForSearch'
const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const searchInput = '[data-cy=search__text]'

let workspaceId

const contentHtmlDocGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: htmlDocTitle } })
const contentThreadGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: threadTitle } })
const contentFileGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: fileTitle } })
const contentThreadTitleLongGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: threadTitleLong } })

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
    cy.visitPage({ pageName: PAGES.HOME })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('that match two documents and validating', () => {
    it('Should display the results', () => {
      cy.get(searchInput).type(threadTitle).type('{enter}')

      cy.get(contentThreadGetter).should('be.visible')
      cy.get(contentThreadTitleLongGetter).should('be.visible')
    })

    it('Should not display the documents that does not match', () => {
      cy.get(contentFileGetter).should('be.not.visible')
      cy.get(contentHtmlDocGetter).should('be.not.visible')
    })

    // INFO - G.B. - 2019-09-06 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
    // describe('then archiving one document', () => {
    //   describe('and searching the same keyword and validating again', () => {
    //     it('Should not display the archived document', () => {
    //       cy.get(searchInput).type(threadTitle).type('{enter}')

    //       cy.get(contentThreadTitleLongGetter).click()
    //       cy.get('[data-cy=archive__button]').click()

    //       cy.get('[data-cy=promptMessage]')
    //       cy.get(searchInput).type('{enter}')

    //       cy.get(contentThreadGetter).should('be.visible')
    //       cy.get(contentThreadTitleLongGetter).should('be.not.visible')
    //     })
    //   })
    // })

    // TODO - GB - 2020-06-02 - This test fails because of a refactor that has not yet been done, but which is scheduled in ticket
    // https://github.com/tracim/tracim/issues/3109
    // describe('then deleting one document', () => {
    //   describe('and searching the same keyword and validating', () => {
    //     it('Should not display the deleted document', () => {
    //       cy.get(searchInput).type(threadTitle).type('{enter}')

    //       cy.get(contentThreadGetter).click()
    //       cy.get('[data-cy=delete__button]').click()

    //       cy.get('[data-cy=promptMessage]')
    //       cy.get(searchInput).type('{enter}')

    //       cy.get('.content').should('have.length', 1)
    //       // cy.get('.searchResult__content__empty').should('be.visible') // INFO - G.B. - 2019-09-06 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
    //     })
    //   })
    // })
  })

  describe('that does not match any documents and validating', () => {
    it('Should display the No results message', () => {
      cy.get(searchInput).type('DoesNotExist').type('{enter}')

      cy.get('.searchResult__content__empty').should('be.visible')
    })
  })

  describe('by changing it in the url', () => {
    const pageNumber = '1'
    const numberByPage = '10'
    const actived = '1'
    const deleted = '0'
    const archived = '0'
    const contentTypes = 'html-document%2Cfile%2Cthread%2Cfolder%2Ccomment'

    before(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createThread(threadTitle, workspaceId)
        cy.createThread(threadTitleLong, workspaceId)
      })
    })

    describe('that match two documents', () => {
      beforeEach(function () {
        cy.loginAs('users')
        cy.visitPage({ pageName: PAGES.SEARCH, params: { searchedKeywords: threadTitle, pageNumber, numberByPage, actived, deleted, archived, contentTypes } })
      })

      it('Should display two results', () => {
        cy.get(contentThreadGetter).should('be.visible')
        cy.get(contentThreadTitleLongGetter).should('be.visible')
      })
    })
  })
})
