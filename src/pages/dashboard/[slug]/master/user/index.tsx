import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { useUsers } from '@/hooks/useUser';
import { UserTable } from '@/components/features/user/UserTable';
import { UserFormDialog } from '@/components/features/user/UserFormDialog';
import { DeleteUserDialog } from '@/components/features/user/DeleteUserDialog';
import { User } from '@/types/user.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function UserPage() {
  const { data: users = [], isLoading, isError } = useUsers();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  // Handlers
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setOpenForm(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setOpenDelete(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setOpenForm(true);
  };

  // Modal Close
  const handleOpenFormChange = (open: boolean) => {
    setOpenForm(open);
    if (!open) setSelectedUser(null);
  };

  const handleOpenDeleteChange = (open: boolean) => {
    setOpenDelete(open);
    if (!open) setSelectedUser(null);
  };

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Pengguna"
            subtitle="Kelola data Pengguna"
          />
          <Card className="rounded-md p-8 flex justify-center items-center h-[300px]">
            <div className="text-destructive font-medium">Terjadi kesalahan saat mengambil data</div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <PageHeader
          title="Pengguna"
          subtitle="Kelola data Pengguna"
        />

        {/* TABLE CARD */}
        <div className="">
          <UserTable data={users} onEdit={handleEdit} onDelete={handleDelete} onAdd={handleCreate} isLoading={isLoading} canEdit={canEdit} canDelete={canDelete} canCreate={canCreate} />
        </div>

        <UserFormDialog open={openForm} onOpenChange={handleOpenFormChange} user={selectedUser} />

        <DeleteUserDialog open={openDelete} onOpenChange={handleOpenDeleteChange} user={selectedUser} />
      </div>
    </DashboardLayout>
  );
}
