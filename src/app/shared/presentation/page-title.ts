const BASE_TITLE = 'Vidriería Alpamayo';

/** Browser tab title of a page: "Vidriería Alpamayo - Inventario". */
export function pageTitle(page?: string): string {
  return page ? `${BASE_TITLE} - ${page}` : BASE_TITLE;
}
