import type { CompleteRegistrationRequest, CreateCategoryRequest, RenameCategoryRequest,
  ResetCategoryOrderRequest, SetCategoryArchivedRequest } from "@taskify/api-contracts";
import { onCall } from "firebase-functions/v2/https";
import { requireAuthenticatedUser } from "../auth/authenticated-user.js";
import { toHttpsError } from "../shared/errors.js";
import { completeRegistration as completeRegistrationOperation } from "../categories/complete-registration.js";
import { createCategory as createCategoryOperation } from "../categories/create-category.js";
import { renameCategory as renameCategoryOperation } from "../categories/rename-category.js";
import { setCategoryArchived as setCategoryArchivedOperation } from "../categories/set-category-archived.js";
import { resetCategoryOrder as resetCategoryOrderOperation } from "../categories/reset-category-order.js";

export const createCategory = onCall<CreateCategoryRequest>(async (request) => {
  try { return await createCategoryOperation(request.data, requireAuthenticatedUser(request).email); }
  catch (error) { throw toHttpsError(error); }
});
export const renameCategory = onCall<RenameCategoryRequest>(async (request) => {
  try { return await renameCategoryOperation(request.data, requireAuthenticatedUser(request).email); }
  catch (error) { throw toHttpsError(error); }
});
export const setCategoryArchived = onCall<SetCategoryArchivedRequest>(async (request) => {
  try { return await setCategoryArchivedOperation(request.data, requireAuthenticatedUser(request).email); }
  catch (error) { throw toHttpsError(error); }
});
export const resetCategoryOrder = onCall<ResetCategoryOrderRequest>(async (request) => {
  try { return await resetCategoryOrderOperation(request.data, requireAuthenticatedUser(request).email); }
  catch (error) { throw toHttpsError(error); }
});
export const completeRegistration = onCall<CompleteRegistrationRequest>(async (request) => {
  try { return await completeRegistrationOperation(request.data, requireAuthenticatedUser(request).email); }
  catch (error) { throw toHttpsError(error); }
});
