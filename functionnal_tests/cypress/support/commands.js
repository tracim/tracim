import 'cypress-wait-until'
import 'cypress-file-upload'
import { PAGES } from './urls_commands'

let LOGIN_URL = '/api/auth/login'

Cypress.Commands.add('loginAs', (role = 'administrators') => {
  if (getCookieValueFromEnv(role)) {
    cy.setSessionCookieFromEnv(role)
    return cy.getUserByRole(role)
  }
  cy.getUserByRole(role).then(user => cy.login(user, role))
})

Cypress.Commands.add('login', (user, role) => {
  return cy.request({
    method: 'POST',
    url: LOGIN_URL,
    body: {
      email: user.email,
      password: user.password
    }
  }).then(response => {
    cy.waitUntil(() => cy.getCookie('session_key').then(cookie => {
      if (cookie && cookie.value) {
        return cy.saveCookieValue(role, cookie.value)
      }
      return false
    }))
    return cy.request({
      method: 'PUT',
      url: '/api/users/' + response.body.user_id,
      body: {
        lang: 'en',
        public_name: response.body.public_name,
        timezone: 'Europe/Paris'
      }
    })
  }).then(response => response.body)
})

Cypress.Commands.add('logout', () => {
  cy.request('POST', '/api/auth/logout')
  cy.cleanSessionCookies()
})

Cypress.Commands.add('typeInHugeRTE', (content) => {
  cy.window()
    .its('hugeRTE')
    .its('activeEditor')
    .then(activeEditor => {
      activeEditor.setContent(content)
      activeEditor.save()
    })
})

Cypress.Commands.add('inputInHugeRTE', (content) => {
  cy.getActiveHugeRTEEditor().then(activeEditor => {
    cy.wrap(activeEditor.getBody()).type(content)
  })
})

Cypress.Commands.add('clearHugeRTE', () => {
  cy.window()
    .its('hugeRTE')
    .its('activeEditor')
    .then(activeEditor => {
      activeEditor.focus()
      activeEditor.execCommand('mceSetContent', false, '')
      activeEditor.fire('input', { data: '' })
      activeEditor.fire('keyup', { key: '' })
      activeEditor.fire('keydown', { key: '' })
    })
})

Cypress.Commands.add('assertHugeRTEContent', (content) => {
  cy.window({ timeout: 5000 })
    .its('hugeRTE')
    .its('activeEditor')
    .then(activeEditor => {
      expect(activeEditor.getContent()).to.have.string(content)
    })
})

Cypress.Commands.add('assertHugeRTEIsActive', (isActive = true) => {
  const message = (isActive ? 'hugeRTE is active' : 'hugeRTE is not active')
  cy.window().then(win => isActive
    ? assert.isNotNull(win.hugeRTE.activeEditor, message)
    : assert.isNull(win.hugeRTE.activeEditor, message)
  )
})

Cypress.Commands.add('dropFixtureInDropZone', (fixturePath, fixtureMime, dropZoneSelector, fileTitle) => {
  // INFO - CH - 2019-06-12 - Adding a handler that bypass exception here because Cypress generates the following
  // "Uncaught Invariant Violation: Cannot call hover while not dragging."
  // Cypress then fail the test because it got an exception
  // Since the tests can continue even with this error, I bypass it, at least for now, because I can't find an
  // easy to fix it
  Cypress.on('uncaught:exception', (err, runnable) => false)

  cy.fixture(fixturePath, 'base64').then(fixture => {
    cy.get(dropZoneSelector).upload( // INFO - CH - 2019-07-10 - upload() is from cypress-file-upload
      {
        fileContent: fixture,
        fileName: fileTitle,
        mimeType: fixtureMime
      },
      {
        subjectType: 'drag-n-drop',
        subjectNature: 'dom',
        // NOTE - SG - 2021-11-15 - force is needed for cases where the drop zone is removed
        // in response to the drop event. Otherwise upload() triggers a drag leave event which fails
        // as the drop zone is detached.
        force: true
      }
    )
  })

  cy.removeAllListeners('uncaught:exception')
})

// FIXME - GB - 2019-07-02 - These events are hardcoded strings because cypress doesn't have the
// @babel/polyfill loaded and crash when using something from tracim_frontend_lib
// https://github.com/tracim/tracim/issues/2041
Cypress.Commands.add('waitForHugeRTELoaded', () => {
  let isHugeRTEActive = false

  cy.window().its('hugeRTE').its('activeEditor').then(activeEditor => {
    if (activeEditor) isHugeRTEActive = true
  })

  cy.document().then($doc => {
    return isHugeRTEActive
      ? true
      : new Cypress.Promise(resolve => { // Cypress will wait for this Promise to resolve
        const onTinyMceLoaded = () => {
          $doc.removeEventListener('tinymceLoaded', onTinyMceLoaded) // cleanup
          resolve() // resolve and allow Cypress to continue
        }
        $doc.addEventListener('tinymceLoaded', onTinyMceLoaded)
      })
  })
})

Cypress.Commands.add('getActiveHugeRTEEditor', () => {
  cy.window().its('hugeRTE.activeEditor.initialized').should('be.true')
  return cy.window().its('hugeRTE.activeEditor')
})

Cypress.Commands.add('form_request', (method, url, formData) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.withCredentials = true
    xhr.open(method, url, true)

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 204) resolve()
        else resolve(JSON.parse(xhr.responseText))
      }
    }

    xhr.send(formData)
  })
})

Cypress.Commands.add('ignoreTinyMceError', () => {
  Cypress.on('uncaught:exception', (err, runnable) => {
    console.log('uncaught:exception')
    return false
  })
})

Cypress.Commands.add('saveCookieValue', (user, cookieValue) => {
  Cypress.env(`session_cookie_${user}`, cookieValue)
  return true
})

Cypress.Commands.add('setSessionCookieFromEnv', (user) => {
  cy.setCookie('session_key', getCookieValueFromEnv(user))
  cy.setCookie('lastConnection', '1')
  cy.setCookie('defaultLanguage', 'en')
})

const getCookieValueFromEnv = (user) => {
  return Cypress.env(`session_cookie_${user}`)
}

Cypress.Commands.add('cleanSessionCookies', () => {
  Cypress.env.reset()
})

Cypress.Commands.add('cancelXHR', () => {
  cy.visit('/assets/cypress-blank.html')
})

Cypress.Commands.add('changeLanguage', (langCode) => {
  cy.visitPage({ pageName: PAGES.ACCOUNT })
  cy.get('.dropdownlang').then(elements => {
    const dropdown = elements[0]
    const button = dropdown.getElementsByTagName('button')[0]
    if (button && button.getAttribute('data-cy') === `${langCode}-active`) return
    cy.get(button).click()
    cy.wrap(dropdown)
      .find(`[data-cy="${langCode}"]`)
      .click()
    cy.get('[data-cy=IconButton_PersonalData]').click()
  })
})

// INFO - CH - 2025-01-06 - This command is used to change language of user admin faster
// than using cy.changeLanguage.
Cypress.Commands.add('changeLanguageFromApiForAdminUser', (langCode) => {
  return cy.request({
    method: 'PUT',
    url: `api/users/1`,
    body: {
      public_name: 'Global Manager',
      timezone: 'Europe/London',
      lang: langCode
    }
  })
})

Cypress.Commands.add('changeLanguageUnloggedPages', (langCode) => {
  cy.get('.dropdownlang').then(elements => {
    const dropdown = elements[0]
    const button = dropdown.getElementsByTagName('button')[0]
    if (button && button.getAttribute('data-cy') === `${langCode}-active`) return
    cy.wrap(dropdown)
      .click()
      .find(`[data-cy="${langCode}"]`)
      .click()
  })
})
