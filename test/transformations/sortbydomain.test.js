const sortByDomain = require('../../src/transformations/sortbydomain');

describe('SortByDomain', () => {
    it('simple test', () => {
        const rules = `! test comment
||track.example.com^
||example.org^
@@||api.example.org^
||ad.example.com^

# more comments`.split(/\r?\n/);
        const filtered = sortByDomain(rules);

        expect(filtered).toHaveLength(7);
        expect(filtered).toEqual([
            '! test comment',
            '||ad.example.com^',
            '||track.example.com^',
            '||example.org^',
            '@@||api.example.org^',
            '',
            '# more comments',
        ]);
    });
});
