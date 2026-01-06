/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as debugTasks from "../debugTasks.js";
import type * as debug_users from "../debug_users.js";
import type * as fix_missing_users from "../fix_missing_users.js";
import type * as programs from "../programs.js";
import type * as registrations from "../registrations.js";
import type * as reports from "../reports.js";
import type * as tasks from "../tasks.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as weeklyReports from "../weeklyReports.js";
import type * as workPrograms from "../workPrograms.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  attendance: typeof attendance;
  auth: typeof auth;
  debugTasks: typeof debugTasks;
  debug_users: typeof debug_users;
  fix_missing_users: typeof fix_missing_users;
  programs: typeof programs;
  registrations: typeof registrations;
  reports: typeof reports;
  tasks: typeof tasks;
  teams: typeof teams;
  users: typeof users;
  weeklyReports: typeof weeklyReports;
  workPrograms: typeof workPrograms;
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
