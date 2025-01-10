import Routory from '../../src/routory';
import { RoutoryFactory } from '../../src/routoryFactory';

jest.mock('../../src/routory');

describe('to make the instanciation of router object injectable as dependency', () => {
  it('should return a Routory object', () => {
    // Action
    const router = new RoutoryFactory().create();

    // Assert
    expect(router).toBeInstanceOf(Routory);
  });
});
