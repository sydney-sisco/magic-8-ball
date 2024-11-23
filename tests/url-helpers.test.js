const { isDiscordCDN, getQueryParamValue } = require('../util/url-helpers');

describe('isDiscordCDN', () => {

  test('Valid Discord CDN URL', () => {
    const url = 'https://cdn.discordapp.com/attachments/1234567890/example.png';
    expect(isDiscordCDN(url)).toBe(true);
  });

  test('Invalid CDN URL', () => {
    const url = 'https://example.com/attachments/123/example.png';
    expect(isDiscordCDN(url)).toBe(false);
  });
});

describe('getQueryParamValue', () => {

  test('Query parameter exists', () => {
    const url = 'https://example.com/path?ex=1234&param=value';
    const key = 'ex';
    expect(getQueryParamValue(url, key)).toBe('1234');
  });

  test('Query parameter does not exist', () => {
    const url = 'https://example.com/path?param=value';
    const key = 'ex';
    expect(getQueryParamValue(url, key)).toBe(null);
  });

  test('Empty string as URL', () => {
    const url = '';
    const key = 'ex';
    expect(getQueryParamValue(url, key)).toBe(null);
  });

  test('Query parameter without value', () => {
    const url = 'https://example.com/path?ex=&param=value';
    const key = 'ex';
    expect(getQueryParamValue(url, key)).toBe('');
  });
});
