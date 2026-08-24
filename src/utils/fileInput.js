/**
 * Wrap a file-input onChange so re-picking the SAME file still fires.
 *
 * <input type="file"> only emits `change` when its value actually changes, so
 * choosing the file that is already selected does nothing at all — no spinner,
 * no error, a completely dead click. That is what "Replace PDF doesn't work"
 * turned out to be: the file was already in the input from the first attempt.
 *
 * Clearing the value after reading the File makes every pick count. Read first,
 * clear second — clearing empties `e.target.files`.
 */
export const onFilePick = (handler) => (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (file) handler(file);
};
