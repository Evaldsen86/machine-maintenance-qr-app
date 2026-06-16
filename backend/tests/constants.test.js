const constants = require('../constants');

describe('Constants exports', () => {
  it('should export ERROR_MESSAGES and SUCCESS_MESSAGES', () => {
    expect(constants).toBeDefined();
    expect(constants.ERROR_MESSAGES).toBeDefined();
    expect(constants.SUCCESS_MESSAGES).toBeDefined();
  });
});
 