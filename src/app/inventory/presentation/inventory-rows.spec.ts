import {matchesSearch} from './inventory-rows';

describe('matchesSearch', () => {
  const row = {searchText: 'pestillo · alemar  negro 0070'};

  it('finds a row when every word appears, in any order', () => {
    expect(matchesSearch(row, 'pestillo negro')).toBe(true);
    expect(matchesSearch(row, '  NEGRO   alemar ')).toBe(true);
    expect(matchesSearch(row, '0070')).toBe(true);
  });

  it('does not find it when a word is missing', () => {
    expect(matchesSearch(row, 'pestillo mate')).toBe(false);
  });

  it('matches everything with an empty search', () => {
    expect(matchesSearch(row, '   ')).toBe(true);
  });
});
