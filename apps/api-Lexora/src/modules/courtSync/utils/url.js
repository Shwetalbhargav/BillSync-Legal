export function absoluteUrl(base, maybeRelative) {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

export function isPdfUrl(url = '') {
  return /\.pdf($|\?)/i.test(url);
}
