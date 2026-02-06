// Module: password-hash.util.ts
// Objective: Provide utility functions for securely hashing and comparing passwords using bcrypt.
// Functionality: Exposes async functions to hash a plain password and to compare a plain password with a hash.
// Expected Result: Passwords are always stored and compared securely using industry best practices.

import bcrypt from 'bcrypt';

// Constant: SALT_ROUNDS
// Objective: Define the computational cost factor for bcrypt hashing.
// Functionality: Determines how many times the password is processed and re-encrypted, making brute-force attacks more difficult.
// Expected Result: Higher values increase security but also increase hashing time; 10 is a common balance for production systems.
const SALT_ROUNDS = 10;

/**
 * Function: hashPassword
 * Objective: Generate a secure hash for a plain text password.
 * Functionality: Uses bcrypt with a salt to hash the password asynchronously.
 * Expected Result: Returns a hashed string to be stored in the database instead of the plain password.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Function: comparePassword
 * Objective: Compare a plain text password with a hashed password.
 * Functionality: Uses bcrypt to check if the plain password matches the hash.
 * Expected Result: Returns true if the password matches, false otherwise.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
