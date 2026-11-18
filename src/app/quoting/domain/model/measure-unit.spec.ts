import {parseMeasureUnit} from './measure-unit';

describe('parseMeasureUnit', () => {
  it('accepts the spellings customers use', () => {
    expect(parseMeasureUnit('cm')).toBe('cm');
    expect(parseMeasureUnit(' Centímetros ')).toBe('cm');
    expect(parseMeasureUnit('MM')).toBe('mm');
    expect(parseMeasureUnit('pulg.')).toBe('in');
    expect(parseMeasureUnit('Pulgadas')).toBe('in');
    expect(parseMeasureUnit('"')).toBe('in');
  });

  it('returns null for unknown units', () => {
    expect(parseMeasureUnit('metros')).toBeNull();
    expect(parseMeasureUnit('')).toBeNull();
  });
});
