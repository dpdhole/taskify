/** Canonical ISO-8601 UTC timestamp string. Category responses/tokens use nine fractional digits
 * to preserve Firestore precision; existing non-Category operations retain their transport format.
 * Runtime validation is performed at API boundaries. */
export type ApiTimestamp = string;
