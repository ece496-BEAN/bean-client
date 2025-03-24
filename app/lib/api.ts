"use client";

export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";
export const jwtObtainPairEndpoint = "auth/login/";
export const jwtRefreshEndpoint = "auth/refresh/";

export function fetchApiSingle(
  endpoint: string,
  method: string,
  token?: string,
): Promise<Response>;
export function fetchApiSingle(
  endpoint: string,
  method: string,
  data: object,
  token?: string,
): Promise<Response>;

export async function fetchApiSingle(
  endpoint: string,
  method: string,
  dataOrToken?: object | string,
  maybeToken?: string,
): Promise<Response> {
  const url = apiUrl + endpoint;

  let headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  let data: object | undefined;

  /* Single argument */
  if (typeof dataOrToken === "string") {
    headers["Authorization"] = `Bearer ${dataOrToken}`;
  } else {
    /* Both arguments */
    data = dataOrToken;
    if (maybeToken) {
      headers["Authorization"] = `Bearer ${maybeToken}`;
    }
  }
  const fetchOptions: RequestInit = {
    method: method,
    headers,
  };
  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok && response.status !== 401) {
    let errorMessage = `HTTP error! Status: ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage += ` - ${JSON.stringify(errorBody)}`;
    } catch (e) {
      // If response is not JSON, just use the status text
      errorMessage += ` - ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  return response;
}

export function fetchApi(
  jwt: any,
  setAndStoreJwt: any,
  endpoint: string,
  method: string,
): Promise<Response>;
export function fetchApi(
  jwt: any,
  setAndStoreJwt: any,
  endpoint: string,
  method: string,
  data: object,
): Promise<Response>;

export async function fetchApi(
  jwt: any,
  setAndStoreJwt: any,
  endpoint: string,
  method: string,
  data?: object,
): Promise<any> {
  let response: Response;
  if (data === undefined) {
    response = await fetchApiSingle(endpoint, method, jwt.access);
  } else {
    response = await fetchApiSingle(endpoint, method, data, jwt.access);
  }
  if (response.status !== 401) {
    return response;
  } else if (jwt.access === undefined) {
    setAndStoreJwt(undefined);
    return response;
  }

  /* Need to refresh the access token */
  let accessToken = undefined;
  try {
    const refreshToken: string = jwt.refresh;
    const refreshResponse: Response = await fetchApiSingle(
      jwtRefreshEndpoint,
      "POST",
      { refresh: refreshToken },
    );
    const refreshData: any = await refreshResponse.json();
    accessToken = refreshData.access;
    if (accessToken === undefined) {
      setAndStoreJwt(undefined);
      return response;
    }
    setAndStoreJwt({ access: accessToken, refresh: refreshToken });
  } catch {
    setAndStoreJwt(undefined);
    return response;
  }

  if (data === undefined) {
    response = await fetchApiSingle(endpoint, method, accessToken);
  } else {
    response = await fetchApiSingle(endpoint, method, data, accessToken);
  }

  return response;
}
