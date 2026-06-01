import { api } from "./client";

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ accessToken: string }>("/admin/auth/login", {
      username,
      password,
    }),
};
