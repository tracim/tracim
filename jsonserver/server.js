const jsonServer = require('json-server')
const jsonDb = require('./static_db.json')
const timezoneDb = require('./timezone.json')
const server = jsonServer.create()
const router = jsonServer.router() // for persistence : jsonServer.router('static_db.json')
const middlewares = jsonServer.defaults()
const GLOBAL_PORT = 3001

function shuffle(array) {
  let currentIndex = array.length
  let randomIndex

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    ;[array[randomIndex], array[currentIndex]] = [array[currentIndex], array[randomIndex]]
  }

  return array;
}

server.use(middlewares)
server.use(jsonServer.bodyParser)

// res.jsonp(req.query)
server.get('/echo', (req, res) => res.jsonp('gg'))
server.get('/login', (req, res) => res.jsonp(jsonDb.login))
server.get('/user_logged', (req, res) => res.jsonp(jsonDb.user_logged))
server.delete('/deletenodata', (req,res) => res.status(204).jsonp(''))
server.patch('/user', (req, res) => res.jsonp({lang: 'fr'}))
// server.put('/api/data/raw_materials_vendors/:vendorid', (req, res) => {
//  res.jsonp(jsonVendorColorData.vendorVariableData)
//   console.log(req.body)
//   res.jsonp('gg')
// })

server.get('/lang', (req, res) => res.jsonp(jsonDb.lang))

server.post('/sessions/login', (req, res) => {
  if (req.body.login !== '' && req.body.password !== '') return res.jsonp(jsonDb.user_logged)
  else return res.jsonp('error')
})

server.get('/app/config', (req, res) => res.jsonp(jsonDb.app_config))

server.get('/sessions/whoami', (req, res) =>
  // res.jsonp({"logged": false})
  res.jsonp(jsonDb.user_logged)
)

server.get('/user/:id/workspace', (req, res) => res.jsonp(jsonDb.workspace_list))

server.get('/workspace/:id', (req, res) => res.jsonp(
  {} // this EP should return meta data of the workspace (id, description, label, slug, sidebar_entries (?)
))

server.get('/workspace/:idws/contents/', (req, res) => {
  console.log(req.query)
  if (req.query.parent_id !== undefined) { // get content of a folder
    switch (req.query.parent_id) {
      case '3':
        return res.jsonp(jsonDb.folder_content_3)
      case '11':
        return res.jsonp(jsonDb.folder_content_11)
    }
  } else { // get content of a workspace
    return res.jsonp(
      Object.assign(
        {},
        jsonDb.workspace_detail,
        {
          content: shuffle(jsonDb.workspace_detail.content.map(
            c => Object.assign({}, c, {workspace_id: req.params.idws})
          ))
        },
        {id: req.params.idws}
      )
    )
  }
})

server.get('/user/:id/roles', (req, res) => res.jsonp(jsonDb.user_role))

server.get('/timezone', (req, res) => res.jsonp(timezoneDb.timezone))

server.get('/workspace/:idws/contents/:idc', (req, res) => {
  switch (req.params.idc) {
    case '1': // pageHtml
    case '5':
      return res.jsonp(jsonDb.content_data_pageHtml)
    case '2':
      return res.jsonp(jsonDb.content_data_thread)
    case '6':
      return res.jsonp({})
  }
})

server.get('/workspace/:idws/contents/:idc/timeline', (req, res) => {
  switch (req.params.idc) {
    case '1': // pageHtml
    case '5':
      return res.jsonp(jsonDb.timeline)
    case '2':
      return res.jsonp([])
    case '6': // File
      return res.jsonp(jsonDb.timeline)
  }
})

server.use(router)
server.listen(GLOBAL_PORT, () => {
  console.log('JSON Server is running on port : ' + GLOBAL_PORT)
})


/*
Object.keys(req) :
['_readableState', 'readable', 'domain', '_events', '_eventsCount', '_maxListeners', 'socket', 'connection',
'httpVersionMajor', 'httpVersionMinor', 'httpVersion', 'complete', 'headers', 'rawHeaders', 'trailers', 'rawTrailers',
'upgrade', 'url', 'method', 'statusCode', 'statusMessage', 'client', '_consuming', '_dumped', 'next', 'baseUrl',
'originalUrl', '_parsedUrl', 'params', 'query', 'res', '_parsedOriginalUrl', '_startAt', '_startTime', '_remoteAddress',
'body', 'route' ]

 */
