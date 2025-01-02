import { pathSeperator } from './configs';
/**
 * Try to normalize input path in this way:
 *
 *  1- remove path-seperator from start
 *  2- remove path-seperator from end
 *
 * For example the path "/a/b/c/" convert to "a/b/c"
 * @param path The input path to normalize
 * @returns Normalized path
 */
export function pathNormalizing(path: string) {
  path = path.trim();
  if (path.startsWith(pathSeperator)) {
    path = path.substring(1);
  }
  if (path.endsWith(pathSeperator)) {
    path = path.substring(0, path.length - 1);
  }
  return path;
}
