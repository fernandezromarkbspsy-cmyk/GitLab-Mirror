import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Check,
  Copy,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import type { ManagedUser, Role } from "../types";
import { Skiper87 } from "../components/ui/skiper-ui/skiper87";

const roles: Role[] = [
  "ops_pic",
  "fte_ops",
  "fte_mm",
  "doc_officer",
];
const roleLabels: Record<Role, string> = {
  ops_pic: "Ops PIC",
  fte_ops: "FTE Operations",
  fte_mm: "FTE Midmile",
  doc_officer: "DOC Officer",
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function formatJoinedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export function UserManagement() {
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [search, setSearch] = useState("");
  const [issuedCredential, setIssuedCredential] = useState<{
    name: string;
    password: string;
  } | null>(null);
  const [credentialCopied, setCredentialCopied] = useState(false);
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => api<{ data: ManagedUser[] }>("/users"),
  });
  const create = useMutation({
    mutationFn: (body: { name: string; ops_id: string }) =>
      api<{ name: string; initial_password: string }>("/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async (data) => {
      setCreating(false);
      setIssuedCredential({ name: data.name, password: data.initial_password });
      await client.invalidateQueries({ queryKey: ["users"] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      api(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["users"] }),
  });
  const disable = useMutation({
    mutationFn: (id: string) =>
      api(`/users/${id}/disable`, { method: "PATCH" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["users"] }),
  });
  const reset = useMutation({
    mutationFn: (id: string) =>
      api<{ initial_password: string }>(`/users/${id}/reset-password`, {
        method: "POST",
      }),
    onSuccess: async (data) => {
      setIssuedCredential({
        name: resetUser?.name ?? "User",
        password: data.initial_password,
      });
      setCredentialCopied(false);
      setResetUser(null);
      await client.invalidateQueries({ queryKey: ["users"] });
    },
  });

  async function copyIssuedCredential() {
    if (!issuedCredential) return;
    try {
      await navigator.clipboard.writeText(issuedCredential.password);
      setCredentialCopied(true);
    } catch {
      setCredentialCopied(false);
    }
  }

  function closeIssuedCredential() {
    setIssuedCredential(null);
    setCredentialCopied(false);
  }

  const allUsers = users.data?.data ?? [];
  const query = search.trim().toLowerCase();
  const filteredUsers = query
    ? allUsers.filter((user) =>
        [user.name, user.email, user.ops_id, roleLabels[user.role]].some(
          (value) => value?.toLowerCase().includes(query),
        ),
      )
    : allUsers;
  const activeUsers = allUsers.filter((user) => user.is_active).length;
  const roleCount = new Set(allUsers.map((user) => user.role)).size;

  return (
    <div className="workspace-view user-management-view">
      <header className="users-page-header">
        <div>
          <p className="users-page-kicker">Access control</p>
          <h1>User management</h1>
          <p>
            Manage operations access, roles, and account status from one place.
          </p>
        </div>
        <button
          className="users-primary-action"
          type="button"
          onClick={() => setCreating(true)}
        >
          <Plus size={17} />
          Add Ops PIC
        </button>
      </header>

      <section className="users-summary" aria-label="User account summary">
        <div className="users-summary-card">
          <span className="users-summary-icon">
            <Users size={17} />
          </span>
          <span>
            <small>Total users</small>
            <strong>{allUsers.length}</strong>
          </span>
        </div>
        <div className="users-summary-card">
          <span className="users-summary-icon users-summary-icon--lime">
            <ShieldCheck size={17} />
          </span>
          <span>
            <small>Active accounts</small>
            <strong>{activeUsers}</strong>
          </span>
        </div>
        <div className="users-summary-card">
          <span className="users-summary-icon users-summary-icon--blue">
            <UserRound size={17} />
          </span>
          <span>
            <small>Role groups</small>
            <strong>{roleCount}</strong>
          </span>
        </div>
      </section>

      {(update.error || disable.error || reset.error) && (
        <p className="notice error users-notice">
          {(update.error || disable.error || reset.error)?.message}
        </p>
      )}
      <section className="panel data-panel users-table-panel">
        <div className="users-table-toolbar">
          <div>
            <h2>Directory</h2>
            <p>
              {query
                ? `${filteredUsers.length} matching accounts`
                : "All provisioned accounts"}
            </p>
          </div>
          <label className="users-search">
            <Search size={16} />
            <span className="sr-only">Search users</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, or role"
            />
          </label>
        </div>
        {users.isPending ? (
          <UserTableLoading />
        ) : users.error ? (
          <div className="users-table-state">
            <strong>Unable to load users</strong>
            <p>{users.error.message}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-table-state">
            <strong>{query ? "No matching users" : "No users yet"}</strong>
            <p>
              {query
                ? "Try a different name, email, or role."
                : "Create an Ops PIC account to start building the directory."}
            </p>
          </div>
        ) : (
          <div className="table-wrap request-table-wrap">
            <Skiper87 className="request-table-scroll">
              <table className="request-table users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Identifier</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-identity">
                          <span className="user-avatar">
                            {initials(user.name)}
                          </span>
                          <span>
                            <strong>{user.name}</strong>
                            <small>
                              {user.is_active
                                ? "Account enabled"
                                : "Account disabled"}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="user-identifier">
                          {user.email || user.ops_id || "-"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="user-role-select"
                          aria-label={`Role for ${user.name}`}
                          value={user.role}
                          onChange={(event) =>
                            update.mutate({
                              id: user.id,
                              body: {
                                name: user.name,
                                role: event.target.value as Role,
                              },
                            })
                          }
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span
                          className={`user-status ${user.is_active ? "user-status--active" : "user-status--disabled"}`}
                        >
                          <i />
                          {user.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td>
                        <span className="user-joined">
                          {formatJoinedDate(user.created_at)}
                        </span>
                      </td>
                      <td className="users-actions">
                        {user.is_active && (
                          <>
                            {user.role === "ops_pic" && (
                              <button className="table-action" type="button" aria-label={`Reset password for ${user.name}`} onClick={() => setResetUser(user)}>
                                <RotateCcw size={15} />
                                Reset Password
                              </button>
                            )}
                            <button className="table-action reject" type="button" aria-label={`Disable ${user.name}`} onClick={() => disable.mutate(user.id)}>
                              <UserX size={15} />
                              Disable
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Skiper87>
          </div>
        )}
      </section>
      {creating && (
        <CreateUser
          busy={create.isPending}
          error={create.error?.message}
          onClose={() => setCreating(false)}
          onSubmit={(body) => create.mutate(body)}
        />
      )}
      <Modal open={resetUser !== null} onClose={() => !reset.isPending && setResetUser(null)} ariaLabel="Reset user password" className="form-dialog compact">
        <div className="dialog-head">
          <div>
            <p className="users-page-kicker">Account recovery</p>
            <h2>Reset User Password</h2>
          </div>
          <button className="icon-button" type="button" onClick={() => setResetUser(null)} aria-label="Cancel password reset"><X size={18} /></button>
        </div>
        <p>Reset {resetUser?.name}'s password to a new one-time password? They will create a new permanent password at their next sign-in.</p>
        {reset.error && <p className="notice error" role="alert">{reset.error.message}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" disabled={reset.isPending} onClick={() => setResetUser(null)}>Cancel</button>
          <button type="button" disabled={reset.isPending} onClick={() => resetUser && reset.mutate(resetUser.id)}>{reset.isPending ? "Resetting..." : "Confirm"}</button>
        </div>
      </Modal>
      <Modal open={issuedCredential !== null} onClose={closeIssuedCredential} ariaLabel="One-time password issued" className="form-dialog compact">
        <div className="dialog-head">
          <div>
            <p className="users-page-kicker">Share securely</p>
            <h2>One-time password for {issuedCredential?.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={closeIssuedCredential} aria-label="Close"><X size={18} /></button>
        </div>
        <p>This password is shown only once. Share it with {issuedCredential?.name} through a secure channel — it will not be shown again.</p>
        <div className="user-issued-password">
          <code>{issuedCredential?.password}</code>
          <button type="button" className="secondary-button" onClick={() => void copyIssuedCredential()} aria-label="Copy one-time password">
            {credentialCopied ? <Check size={15} /> : <Copy size={15} />}
            {credentialCopied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="dialog-actions">
          <button type="button" onClick={closeIssuedCredential}>Done</button>
        </div>
      </Modal>
    </div>
  );
}

function UserTableLoading() {
  return (
    <div className="users-loading" role="status" aria-label="Loading users">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="users-loading-row" key={index}>
          <Skeleton width="72%" />
          <Skeleton />
          <Skeleton />
          <Skeleton width="64%" />
        </div>
      ))}
    </div>
  );
}

function CreateUser({
  busy,
  error,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (body: { name: string; ops_id: string }) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      name: String(data.get("name") ?? ""),
      ops_id: String(data.get("ops_id") ?? ""),
    });
  }
  return (
    <Modal
      open
      onClose={onClose}
      className="form-dialog compact"
      ariaLabel="Add Ops PIC"
    >
      <div className="dialog-head">
        <h2>Add Ops PIC</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      <form onSubmit={submit}>
        <label>
          Name
          <input name="name" required />
        </label>
        <label>
          OPS ID
          <input
            name="ops_id"
            required
            pattern="ops[0-9]+"
            placeholder="ops12345"
          />
        </label>
        {error && <p className="notice error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
