/**
 * Sends an authenticated API request using the stored Supabase JWT and
 * transparently refreshes the session once if the access token has expired.
 */
export const authorizedFetch = async (url, options = {}, user, dispatch) => {
  const buildHeaders = (token) => ({
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  });

  let response = await fetch(url, {
    ...options,
    headers: buildHeaders(user.token),
  });

  if (response.status === 401 && user.refreshToken) {
    const refreshRes = await fetch("/api/user/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: user.refreshToken }),
    });

    if (refreshRes.ok) {
      const refreshedUser = await refreshRes.json();
      localStorage.setItem("user", JSON.stringify(refreshedUser));
      if (dispatch) {
        dispatch({ type: "LOGIN", payload: refreshedUser });
      }
      response = await fetch(url, {
        ...options,
        headers: buildHeaders(refreshedUser.token),
      });
    } else {
      localStorage.removeItem("user");
      if (dispatch) {
        dispatch({ type: "LOGOUT" });
      }
    }
  }

  return response;
};
