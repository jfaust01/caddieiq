// Test stub for the `server-only` package.
//
// `server-only` is a build-time guard that throws if a server module is pulled
// into a client bundle. It has no runtime behavior. Under Vitest (a plain Node
// environment) there is no client/server boundary, so importing the real
// package throws spuriously and prevents server modules — repositories,
// import services — from being unit-tested. Aliasing it to this empty module
// removes the false failure while leaving the guard fully active in real builds.
export {}
