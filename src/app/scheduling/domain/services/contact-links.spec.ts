import {mapsLink, whatsappLink, whatsappNumber} from './contact-links';

describe('contact links', () => {
  it('adds the Peru code to 9-digit mobile numbers', () => {
    expect(whatsappNumber('943 111 222')).toBe('51943111222');
    expect(whatsappNumber('+51 943-111-222')).toBe('51943111222');
    expect(whatsappNumber('043 421234')).toBe('043421234');
    expect(whatsappNumber('123')).toBeNull();
  });

  it('builds a WhatsApp link with the message encoded', () => {
    expect(whatsappLink('943111222', 'Visita 20/11 10:00 — Jr. Ficticio 100'))
      .toBe('https://wa.me/51943111222?text=Visita%2020%2F11%2010%3A00%20%E2%80%94%20Jr.%20Ficticio%20100');
    expect(whatsappLink('12', 'hola')).toBeNull();
  });

  it('searches the address in Google Maps, adding the city only when missing', () => {
    expect(mapsLink('Jr. Ficticio 100', 'Huaraz, Áncash'))
      .toBe('https://www.google.com/maps/search/?api=1&query=Jr.%20Ficticio%20100%2C%20Huaraz%2C%20%C3%81ncash');
    expect(mapsLink('Av. Luzuriaga 500, Huaraz', 'Huaraz, Áncash'))
      .toBe('https://www.google.com/maps/search/?api=1&query=Av.%20Luzuriaga%20500%2C%20Huaraz');
  });
});
