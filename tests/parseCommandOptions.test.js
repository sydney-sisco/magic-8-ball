const { parseCommandOptions } = require('../util/shared-helpers');

describe('parseCommandOptions', () => {

  test('Single hyphen option', () => {
    const input = '-v';
    const expected = { v: true };
    expect(parseCommandOptions(input)).toEqual(expected);
  });

  test('Single hyphen option with value', () => {
    const input = '-f file.txt';
    const expected = { f: 'file.txt' };
    expect(parseCommandOptions(input)).toEqual(expected);
  });

  test('Simple command line options', () => {
    const input = '-f file.txt -i -d dest_dir';
    const expected = { f: 'file.txt', i: true, d: 'dest_dir' };
    expect(parseCommandOptions(input)).toEqual(expected);
  });

  test('Single hyphen option with value containing spaces', () => {
    const input = '-f "file with spaces.txt"';
    const expected = { f: 'file with spaces.txt' };
    expect(parseCommandOptions(input)).toEqual(expected);
  });

  // two options with values containing spaces
  test('Single hyphen option with value containing spaces', () => {
    const input = '-f "file with spaces.txt" -d "destination directory"';
    const expected = { f: 'file with spaces.txt', d: 'destination directory' };
    expect(parseCommandOptions(input)).toEqual(expected);
  });

  test('Double hyphen option', () => {
    const input = '--verbose';
    const expected = { verbose: true };
    expect(parseCommandOptions(input)).toEqual(expected);
  });

  test('Mixed single and double hyphen options', () => {
    const input = '-a --long-option value --flag';
    const expected = { a: true, 'long-option': 'value', flag: true };
    expect(parseCommandOptions(input)).toEqual(expected);
  });

  test('Duplicate option with different values', () => {
    const input = '-x value1 -x value2';
    const expected = { x: 'value2' }; // The second -x overrides the first -x value
    expect(parseCommandOptions(input)).toEqual(expected);
  });

  test('Empty input string', () => {
    const input = '';
    const expected = {}; // Empty input string should result in an empty object
    expect(parseCommandOptions(input)).toEqual(expected);
  });
});
