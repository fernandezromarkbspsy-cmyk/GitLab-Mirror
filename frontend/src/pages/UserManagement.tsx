import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserX, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import type { ManagedUser, Role } from '../types';

const roles: Role[] = ['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer', 'dock_officer'];

export function UserManagement() {
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<{data:ManagedUser[]}>('/users') });
  const create = useMutation({ mutationFn: (body: unknown) => api('/users', { method: 'POST', body: JSON.stringify(body) }), onSuccess: async () => { setCreating(false); await client.invalidateQueries({ queryKey: ['users'] }); } });
  const update = useMutation({ mutationFn: ({ id, body }: {id:string;body:unknown}) => api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }), onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }) });
  const disable = useMutation({ mutationFn: (id: string) => api(`/users/${id}/disable`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }) });

  return <div className="workspace-view"><div className="page-actions"><button onClick={() => setCreating(true)}><Plus size={17}/>Add Ops PIC</button></div>{(update.error || disable.error) && <p className="notice error">{(update.error || disable.error)?.message}</p>}<section className="panel data-panel"><div className="table-wrap request-table-wrap"><table className="request-table"><thead><tr><th>User</th><th>Identifier</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{(users.data?.data ?? []).map(user => <tr key={user.id}><td>{user.name}</td><td>{user.email || user.ops_id || '-'}</td><td><select value={user.role} onChange={event => update.mutate({ id: user.id, body: { name: user.name, role: event.target.value as Role } })}>{roles.map(role => <option key={role}>{role}</option>)}</select></td><td>{user.is_active ? 'Active' : 'Disabled'}</td><td>{user.is_active && <button className="table-action reject" onClick={() => disable.mutate(user.id)}><UserX size={15}/>Disable</button>}</td></tr>)}</tbody></table></div></section>{creating && <CreateUser busy={create.isPending} error={create.error?.message} onClose={() => setCreating(false)} onSubmit={body => create.mutate(body)}/>}</div>;
}

function CreateUser({ busy, error, onClose, onSubmit }: {busy:boolean;error?:string;onClose:()=>void;onSubmit:(body:unknown)=>void}) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ name: data.get('name'), ops_id: data.get('ops_id') }); }
  return <Modal open onClose={onClose} className="form-dialog compact" ariaLabel="Add Ops PIC"><div className="dialog-head"><h2>Add Ops PIC</h2><button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X/></button></div><form onSubmit={submit}><label>Name<input name="name" required /></label><label>OPS ID<input name="ops_id" required pattern="ops[0-9]+" placeholder="ops12345" /></label>{error && <p className="notice error">{error}</p>}<div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Creating...' : 'Create user'}</button></div></form></Modal>;
}
