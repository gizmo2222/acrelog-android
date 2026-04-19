const CODE_MAP: Record<string, string> = {
  // Auth
  'auth/wrong-password':        'Incorrect password. Please try again.',
  'auth/invalid-credential':    'Incorrect email or password.',
  'auth/user-not-found':        'No account found with that email.',
  'auth/email-already-in-use':  'That email is already registered. Try signing in instead.',
  'auth/invalid-email':         "That doesn't look like a valid email address.",
  'auth/weak-password':         'Password must be at least 6 characters.',
  'auth/too-many-requests':     'Too many attempts. Wait a few minutes and try again.',
  'auth/network-request-failed':'Check your internet connection and try again.',
  'auth/user-disabled':         'This account has been disabled. Contact support.',
  'auth/requires-recent-login': 'Please sign out and sign back in, then try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',

  // Firestore / general Firebase
  'permission-denied':          "You don't have permission to do that.",
  'not-found':                  'That record no longer exists.',
  'unavailable':                "Can't reach the server. Check your connection and try again.",
  'deadline-exceeded':          'The request timed out. Try again.',
  'already-exists':             'That record already exists.',
  'resource-exhausted':         'Too many requests. Try again in a moment.',
  'unauthenticated':            'You need to be signed in to do that.',
  'cancelled':                  'The operation was cancelled.',
  'data-loss':                  'Data could not be read. Try again.',

  // Storage
  'storage/unauthorized':       "You don't have permission to upload files.",
  'storage/quota-exceeded':     'Storage quota exceeded. Contact support.',
  'storage/unknown':            'Upload failed. Check your connection and try again.',
  'storage/object-not-found':   'File not found.',
  'storage/cancelled':          'Upload was cancelled.',
  'storage/retry-limit-exceeded': 'Upload timed out. Check your connection and try again.',
};

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  const code: string | undefined = (error as any)?.code;
  if (code && CODE_MAP[code]) return CODE_MAP[code];

  // Firebase error codes are often embedded in the message as "(auth/...)"
  if (code) {
    const shortCode = code.includes('/') ? code.split('/')[1] : code;
    const byShort = CODE_MAP[shortCode];
    if (byShort) return byShort;
  }

  const msg: string | undefined = (error as any)?.message;
  if (msg) {
    // Pull the Firebase code out of "Firebase: Error (auth/wrong-password)." style messages
    const match = msg.match(/\(([a-z-]+\/[a-z-]+)\)/);
    if (match && CODE_MAP[match[1]]) return CODE_MAP[match[1]];
    // Network-level
    if (msg.toLowerCase().includes('network')) return 'Check your internet connection and try again.';
    if (msg.toLowerCase().includes('timeout')) return 'The request timed out. Try again.';
  }

  return fallback;
}
