var tracimJsTraduction = {
  btnWorkMode: {
    fr_FR: "Mode d'édition",
    en_US: 'Work mode'
  },
  btnReadMode: {
    fr_FR: 'Mode de lecture',
    en_US: 'Read mode'
  },
  select2EmptyResult: {
    fr_FR: 'Aucun résultats',
    en_US: 'No results found'
  }
}

function __ (tradId) {
  return tracimJsTraduction[tradId][globalTracimLang]
}
