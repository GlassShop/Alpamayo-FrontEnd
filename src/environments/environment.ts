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
  priceHistoryEndpointPath: '/price-history',
  usersEndpointPath: '/users',
  quotesEndpointPath: '/quotes',
  documentLookupEndpointPath: '/document-lookup',
  techniciansEndpointPath: '/technicians',
  visitsEndpointPath: '/visits',
  seriesEndpointPath: '/series',
  productsEndpointPath: '/products',
  productPriceHistoryEndpointPath: '/product-price-history',
  sitesEndpointPath: '/sites',
  inventoryItemsEndpointPath: '/inventory-items',
  stockLevelsEndpointPath: '/stock-levels',
  stockMovementsEndpointPath: '/stock-movements',
  purchasesEndpointPath: '/purchases',
  costSettingsEndpointPath: '/cost-settings',
  saleSettingsEndpointPath: '/sale-settings'
};
