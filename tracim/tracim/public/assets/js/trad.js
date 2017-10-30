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
  const normalizedLang = (() => {
    switch (globalTracimLang) { // @TODO - Côme - 2017/10/30 - need a more secure way to handle different langs
      case 'fr':
      case 'fr-fr':
      case 'fr_FR':
        return 'fr_FR';
      case 'en':
      case 'en_US':
        return 'en_US';
      default:
        return 'en_US';
    }
  })()
  return tracimJsTraduction[tradId][normalizedLang]
}
