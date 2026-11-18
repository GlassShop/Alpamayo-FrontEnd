/**
 * Company data printed on quotes.
 *
 * TODO: move to server-side settings editable by the CEO when the backend
 * exists. Fields marked "por completar" must be filled with the real data.
 */
export const COMPANY_PROFILE = {
  name: 'Vidriería Alpamayo',
  tagline: 'Venta mayorista de vidrios',
  city: 'Huaraz, Áncash',
  ruc: 'RUC por completar',
  address: 'Dirección por completar',
  phone: 'Teléfono por completar',
  /** Days a quote remains valid. */
  quoteValidityDays: 7,
  /** Sale conditions accepted by the customer, printed at the foot of every quote. */
  saleConditions: [
    'Nos reservamos el derecho de aceptar cambios y devoluciones independientemente del cobro del gasto generado.',
    'Es responsabilidad del cliente validar las especificaciones, condiciones especiales, de uso y diseño del producto adquirido.',
    'Toda mercadería separada que no es recogida dentro de un mes no se le reconocerá al cliente.',
  ],
} as const;
