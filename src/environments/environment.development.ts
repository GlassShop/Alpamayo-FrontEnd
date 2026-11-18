/**
 * Every server address lives here, never in the code.
 * Development points to the local json-server (`npm run api`).
 * TODO: replace apiBaseUrl with the real backend URL once it is deployed (sprint 2).
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  signInEndpointPath: '/authentication/sign-in',
  glassTypesEndpointPath: '/glass-types',
  priceListsEndpointPath: '/price-lists',
  pricesEndpointPath: '/prices',
  priceHistoryEndpointPath: '/price-history',
  usersEndpointPath: '/users',
  quotesEndpointPath: '/quotes',
  documentLookupEndpointPath: '/document-lookup',
  techniciansEndpointPath: '/technicians',
  visitsEndpointPath: '/visits'
};
