import { logoutAction } from "../actions/logout";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-md bg-black px-4 py-2 text-white"
      >
        Sign out
      </button>
    </form>
  );
}