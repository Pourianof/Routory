import * as utils from '../../src/routeParsingUtils';

describe('utils for parsing paths', () => {
  describe('Normalize route path', () => {
    let normalizer: (typeof utils)['pathNormalizing'];
    beforeEach(() => {
      normalizer = utils.pathNormalizing;
    });
    it('should remove starting forward slash', () => {
      // arrange
      const inputRoute = '/a/b/c';

      // actual
      const actual = normalizer(inputRoute);

      // assert
      expect(actual).toBe('a/b/c');
    });

    it('should remove trailing forward slash', () => {
      // arrange
      const inputRoute = '/a/b/c/';

      // actual
      const actual = normalizer(inputRoute);

      // assert
      expect(actual).toBe('a/b/c');
    });
  });
});
