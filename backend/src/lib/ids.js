import mongoose from 'mongoose';
import { notFound } from './errors.js';

/** A malformed id can never match a document, so it is a plain 404 rather than a cast error. */
export function objectId(id, what) {
  if (!mongoose.isValidObjectId(id)) throw notFound(what);
  return id;
}
