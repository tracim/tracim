export const libHandleFetchResult = fetchResult => {
  switch (fetchResult.status) {
    case 200:
    case 304:
      return fetchResult.json()
    case 204:
    case 400:
    case 404:
    case 409:
    case 500:
    case 501:
    case 502:
    case 503:
    case 504:
      return `Error: ${fetchResult.status}` // @TODO : handle errors from api result
  }
}
