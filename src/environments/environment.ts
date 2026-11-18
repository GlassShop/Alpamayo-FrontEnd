/**
 * Every server address lives here, never in the code.
 * TODO: replace apiBaseUrl with the real backend URL once it is deployed (sprint 2).
 */
export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:8080/api/v1',
  signInEndpointPath: '/authentication/sign-in',
  glassTypesEndpointPath: '/glass-types',
  priceListsEndpointPath: '/price-lists',
  pricesEndpointPath: '/prices',
  usersEndpointPath: '/users'
};
