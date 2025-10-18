let accessToken: string | undefined;

type Listener = (token: string | undefined) => void;

const listeners = new Set<Listener>();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | undefined) {
  accessToken = token;
  for (const listener of listeners) {
    listener(accessToken);
  }
}

export function subscribeToAccessToken(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
