import type { ModelRegistry } from "@earendil-works/pi-coding-agent";

export const XAI_PROVIDER_ID = "xai";
export const XAI_API_BASE_URL = "https://api.x.ai/v1";
const OAUTH_AUTH_SOURCE = "OAuth";
const STORED_AUTH_STATUS_SOURCE = "stored";
const LOGIN_HINT = "Run `/login xai` and choose the SuperGrok or X Premium sign-in.";

export type XaiAuthRegistry = Pick<
  ModelRegistry,
  | "getProvider"
  | "getProviderAuth"
  | "getProviderAuthStatus"
  | "getRegisteredNativeProvider"
  | "getRegisteredProviderConfig"
  | "isUsingOAuth"
>;

export class XaiAuthGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XaiAuthGuardError";
  }
}

export class XaiBearerToken {
  readonly #value: string;

  constructor(value: string) {
    this.#value = value;
  }

  reveal(): string {
    return this.#value;
  }

  toJSON(): string {
    return "[redacted]";
  }

  toString(): string {
    return "[redacted]";
  }
}

export interface GuardedXaiRuntime {
  baseUrl: typeof XAI_API_BASE_URL;
  bearer: XaiBearerToken;
}

// Checks only provider layering and credential-type metadata, so it never reads or refreshes a credential.
export function assertFirstPartyXaiSubscriptionProvider(registry: XaiAuthRegistry): void {
  if (
    registry.getRegisteredNativeProvider(XAI_PROVIDER_ID) !== undefined ||
    registry.getRegisteredProviderConfig(XAI_PROVIDER_ID) !== undefined
  ) {
    throw new XaiAuthGuardError(
      'An extension has replaced or reconfigured the "xai" provider; xai_search only uses Pi\'s built-in xAI provider.',
    );
  }

  const provider = registry.getProvider(XAI_PROVIDER_ID);
  if (!provider) {
    throw new XaiAuthGuardError(`Pi's built-in "xai" provider is unavailable. ${LOGIN_HINT}`);
  }

  if (provider.baseUrl !== XAI_API_BASE_URL) {
    throw new XaiAuthGuardError(
      `The "xai" provider base URL is not ${XAI_API_BASE_URL}; remove the override before using xai_search.`,
    );
  }

  if (provider.auth.oauth?.isSubscription !== true) {
    throw new XaiAuthGuardError('The "xai" provider does not offer subscription OAuth sign-in.');
  }

  const status = registry.getProviderAuthStatus(XAI_PROVIDER_ID);
  if (!status.configured) {
    throw new XaiAuthGuardError(`No xAI sign-in found. ${LOGIN_HINT}`);
  }
  if (status.source !== STORED_AUTH_STATUS_SOURCE) {
    throw new XaiAuthGuardError(
      `xAI credentials come from ${status.source ?? "an unknown source"}, not a stored subscription sign-in. ${LOGIN_HINT}`,
    );
  }

  // A stored API key also reports source "stored", so the stored credential type must be checked too.
  const catalogModel = provider.getModels()[0];
  if (!catalogModel || !registry.isUsingOAuth(catalogModel)) {
    throw new XaiAuthGuardError(`The stored xAI credential is not an OAuth sign-in. ${LOGIN_HINT}`);
  }
}

export async function resolveGuardedXaiRuntime(registry: XaiAuthRegistry): Promise<GuardedXaiRuntime> {
  assertFirstPartyXaiSubscriptionProvider(registry);

  let resolution: Awaited<ReturnType<XaiAuthRegistry["getProviderAuth"]>>;
  try {
    resolution = await registry.getProviderAuth(XAI_PROVIDER_ID);
  } catch {
    // The underlying error can carry credential-adjacent detail, so it is not propagated.
    throw new XaiAuthGuardError(`Could not resolve the xAI subscription sign-in. ${LOGIN_HINT}`);
  }

  if (!resolution) {
    throw new XaiAuthGuardError(`No xAI sign-in found. ${LOGIN_HINT}`);
  }
  if (resolution.source !== OAUTH_AUTH_SOURCE) {
    throw new XaiAuthGuardError(
      `xAI credentials resolved from ${resolution.source ?? "an unknown source"}, not subscription OAuth. ${LOGIN_HINT}`,
    );
  }
  if (resolution.auth.baseUrl !== undefined && resolution.auth.baseUrl !== XAI_API_BASE_URL) {
    throw new XaiAuthGuardError(`xAI sign-in resolved a base URL other than ${XAI_API_BASE_URL}.`);
  }

  const apiKey = resolution.auth.apiKey?.trim();
  if (!apiKey) {
    throw new XaiAuthGuardError(`The xAI subscription sign-in did not yield a bearer token. ${LOGIN_HINT}`);
  }

  return { baseUrl: XAI_API_BASE_URL, bearer: new XaiBearerToken(apiKey) };
}
