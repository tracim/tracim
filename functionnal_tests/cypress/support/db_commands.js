const userFixtures = {
  'administrators': 'defaultAdmin',
  'trusted-users': '',
  'users': 'baseUser'
}

function makeRandomString (length = 5) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

Cypress.Commands.add('addUserToWorkspace', (userId, workspaceId, role = 'contributor') => {
  const body = {
    role: role,
    user_id: userId
  }
  cy.request('POST', `/api/v2/workspaces/${workspaceId}/members`, body)
})

Cypress.Commands.add('execAsAdmin', (user, callback) => {
  cy.logout()
  cy.loginAs('administrators')
  const result = callback().then(res => cy.log(res.email))
  cy.logout()
  cy.loginAs(user.profile)
})

Cypress.Commands.add('createRandomUser', (profile = 'users') => {
  const userName = makeRandomString()

  const data = {
    email: `${userName}@tracim.fr`,
    email_notification: false,
    lang: 'en',
    password: '8QLa$<w',
    profile: profile,
    public_name: `${userName}`,
    timezone: 'Europe/Paris'
  }
  return cy
    .request('POST', '/api/v2/users', data)
    .then(response => response.body)
})

Cypress.Commands.add('createUser', (fixturePath = 'baseUser') => {
  return cy
    .fixture(fixturePath)
    .then(userJSON => cy.request('POST', '/api/v2/users', userJSON))
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('createRandomWorkspace', () => {
  const workspaceName = makeRandomString()
  let url = '/api/v2/workspaces'
  const data = {
    description: `A super description of ${workspaceName}.`,
    label: workspaceName
  }
  cy
    .request('POST', url, data)
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url} and body ${JSON.stringify(data)}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('createWorkspace', (fixturePath = 'baseWorkspace') => {
  let url = '/api/v2/workspaces'
  return cy
    .fixture(fixturePath)
    .then(workspaceJSON => cy.request('POST', url, workspaceJSON))
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('setupBaseDB', () => {
  const accum = (...cmds) => {
    const results = []

    cmds.forEach((cmd) => {
      cmd().then(results.push.bind(results))
    })

    return cy.wrap(results)
  }
  cy.loginAs('administrators')
  accum(
    cy.createUser,
    cy.createWorkspace
  )
    .then(([user, workspace]) => {
      cy.addUserToWorkspace(user.user_id, workspace.workspace_id)
    })
    .then(() => cy.logout())
})

Cypress.Commands.add('resetDB', () => {
  cy.exec('rm -rf ./sessions_data')
  cy.exec('rm -rf ./sessions_lock')
  cy.exec('cp /tmp/tracim_cypress.sqlite.tmp /tmp/tracim_cypress.sqlite')
  cy.cleanSessionCookies()
})

Cypress.Commands.add('getUserByRole', (role) => {
  return cy
    .fixture(userFixtures[role])
})

Cypress.Commands.add('createHtmlDocument', (title, workspaceId, parentId = null) => {
  let url = `/api/v2/workspaces/${workspaceId}/contents`
  let data = {
    content_type: 'html-document',
    label: title,
    parent_id: parentId
  }
  cy
    .request('POST', url, data)
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url} and body ${JSON.stringify(data)}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('updateHtmlDocument', (contentId, workspaceId, text, title) => {
  let url = `/api/v2/workspaces/${workspaceId}/html-documents/${contentId}`
  let data = {
    raw_content: text,
    label: title
  }
  cy
    .request('PUT', url, data)
    .then(response => response.body)
})

Cypress.Commands.add('changeHtmlDocumentStatus', (contentId, workspaceId, status) => {
  let url = `/api/v2/workspaces/${workspaceId}/html-documents/${contentId}/status`
  let data = { status: status }
  cy
    .request('PUT', url, data)
    .then(response => response.body)
})

Cypress.Commands.add('createThread', (title, workspaceId, parentId = null) => {
  let url = `/api/v2/workspaces/${workspaceId}/contents`
  let data = {
    content_type: 'thread',
    label: title,
    parent_id: parentId
  }
  cy
    .request('POST', url, data)
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url} and body ${JSON.stringify(data)}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('createFile', (fixturePath, fixtureMime, fileTitle, workspaceId, parentId = null) => {
  let url = `/api/v2/workspaces/${workspaceId}/files`
  cy.fixture(fixturePath, 'base64').then(fixture => {
    cy.window().then(window => {
      Cypress.Blob.base64StringToBlob(fixture, fixtureMime).then(blob => {
        let form = new FormData()
        form.set('files', blob, fileTitle)
        cy
          .form_request('POST', url, form)
          .then(response => {
            if (response === undefined) {
              // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
              // end up with an undefined response we need to dig up to find if it's the server or cypress
              // Issue 1836
              cy.log(`undefined response for request to url ${url} and file title ${fileTitle}`)
              cy.wrap(undefined).should('be.undefined')
            } else {
              return response.body
            }
          })
      })
    })
  })
})

Cypress.Commands.add('logInFile', (message, logPath = '/tmp/cypress.log') => {
  cy.exec(`echo "${message}" >> ${logPath}`)
  cy.exec(`echo "\n" >> ${logPath}`)
  cy.exec(`echo ---------- >> ${logPath}`)
  cy.exec(`echo "\n" >> ${logPath}`)
})
