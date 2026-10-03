// GET /users/search → { users } (system-design.md §4). The server excludes the requester and caps at 5.
export type UserSummary = {
  id: string
  email: string
}

export type UserSearchResponse = {
  users: UserSummary[]
}
