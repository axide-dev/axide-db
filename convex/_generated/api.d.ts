/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as comments from "../comments.js";
import type * as entries from "../entries.js";
import type * as features from "../features.js";
import type * as games from "../games.js";
import type * as hardware from "../hardware.js";
import type * as places from "../places.js";
import type * as reviews from "../reviews.js";
import type * as services from "../services.js";
import type * as software from "../software.js";
import type * as storage from "../storage.js";
import type * as tags from "../tags.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  comments: typeof comments;
  entries: typeof entries;
  features: typeof features;
  games: typeof games;
  hardware: typeof hardware;
  places: typeof places;
  reviews: typeof reviews;
  services: typeof services;
  software: typeof software;
  storage: typeof storage;
  tags: typeof tags;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
