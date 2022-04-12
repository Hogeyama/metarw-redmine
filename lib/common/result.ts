export type Result<T, E> = Result_<T, E, true> | Result_<T, E, false>;
export interface Result_<T, E, B extends boolean> {
  isSuccess: B;
  value: B extends true ? T : undefined;
  error: B extends false ? E : undefined;
  // methods
  map<U>(fn: (value: T) => U): Result<U, E>;
  orElse(f: (error: E) => Result<T, E>): Result<T, E>;
}

export function success<T, E>(value: T): Result<T, E> {
  return {
    isSuccess: true,
    value,
    error: undefined,
    // methods
    orElse: () => success(value),
    map: <U>(fn: (value: T) => U) => success(fn(value)),
  };
}

export function failure<T, E>(error: E): Result<T, E> {
  return {
    isSuccess: false,
    value: undefined,
    error,
    // methods
    orElse: (k) => k(error),
    map: <U>(_: (value: T) => U) => failure<U, E>(error),
  };
}
