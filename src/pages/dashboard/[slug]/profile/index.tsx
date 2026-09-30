import { useEffect, useState } from 'react';
import { AtSign, Camera, Mail, Save, Shield, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { FileInput } from '@/components/ui/file-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { ParsedImage } from '@/components/ui/parsed-image';
import { useAuthMe } from '@/features/auth/hooks/use-auth-me';
import { AuthService } from '@/features/auth/services/auth.service';

export default function ProfilePage() {
    const { data: profileData, isLoading, refetch } = useAuthMe();
    const user = profileData?.data;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        username: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        setFormData({
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            username: user.username || '',
        });
        setAvatarFile(null);
        setAvatarPreview(null);
    }, [user]);

    useEffect(() => {
        return () => {
            if (avatarPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const displayName = user?.name || [formData.firstname, formData.lastname].filter(Boolean).join(' ') || 'Pengguna';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US';

    const roleName = user?.roles?.[0]?.name
        ? user.roles[0].name.charAt(0).toUpperCase() + user.roles[0].name.slice(1)
        : 'User';

    const handleAvatarChange = (file: File | null) => {
        if (file && file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran file gambar maksimal 2MB');
            return;
        }

        if (avatarPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
        }

        setAvatarFile(file);
        setAvatarPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user?.id) return;

        if (!formData.firstname.trim()) {
            toast.error('Nama depan tidak boleh kosong');
            return;
        }
        if (!formData.username.trim()) {
            toast.error('Username tidak boleh kosong');
            return;
        }

        setIsSubmitting(true);
        try {
            await AuthService.updateProfile(user.id, {
                name: [formData.firstname.trim(), formData.lastname.trim()].filter(Boolean).join(' '),
                firstname: formData.firstname.trim(),
                lastname: formData.lastname.trim(),
                username: formData.username.trim(),
                avatar: avatarFile,
            });
            toast.success('Profil berhasil diperbarui!');
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui profil');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <LoadingState variant="page" />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <title>
                    Profil Pengguna
                </title>
                <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white px-5 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#1e3a5f]/10 text-[#1e3a5f]">
                            <UserCircle className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-semibold text-slate-900">Profil Saya</h1>
                            <p className="text-sm text-muted-foreground">Kelola identitas pengguna dan foto profil akun.</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="w-fit border-[#1e3a5f]/20 bg-[#1e3a5f]/5 px-3 py-1 text-[#1e3a5f]">
                        {roleName}
                    </Badge>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                    <Card className="overflow-hidden rounded-md border-slate-200 shadow-sm lg:col-span-1">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                                <Camera className="h-4 w-4 text-[#1e3a5f]" />
                                Foto Profil
                            </CardTitle>
                            <CardDescription>Unggah foto terbaru untuk akun Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 px-5 py-5">
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    {avatarPreview || user?.avatar ? (
                                        <ParsedImage
                                            src={avatarPreview || user?.avatar}
                                            alt="Foto profil"
                                            className="h-32 w-32 rounded-full border-4 border-white bg-slate-100 object-cover shadow-md ring-1 ring-slate-200"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-[#1e3a5f]/10 text-3xl font-semibold text-[#1e3a5f] shadow-md ring-1 ring-slate-200">
                                            {initials}
                                        </div>
                                    )}
                                    <div className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#1e3a5f] text-white shadow-sm">
                                        <Camera className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="max-w-full text-center">
                                    <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                                    <p className="truncate text-xs text-muted-foreground">{user?.email || '-'}</p>
                                </div>
                            </div>

                            <FileInput
                                id="avatar"
                                accept="image/jpeg,image/png,image/webp"
                                value={avatarFile}
                                onFileChange={handleAvatarChange}
                                disabled={isSubmitting}
                                helperText="JPG, PNG, atau WebP maksimal 2 MB"
                            />
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="overflow-hidden rounded-md border-slate-200 shadow-sm">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                                <CardTitle className="text-base text-slate-900">Detail Pribadi</CardTitle>
                                <CardDescription>Perbarui nama dan username yang tampil di sistem.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 py-5">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstname" className="text-sm font-medium text-slate-700">
                                            Nama Depan <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="firstname"
                                            placeholder="Masukkan nama depan"
                                            value={formData.firstname}
                                            onChange={(event) => setFormData({ ...formData, firstname: event.target.value })}
                                            disabled={isSubmitting}
                                            className="h-11 bg-white text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lastname" className="text-sm font-medium text-slate-700">
                                            Nama Belakang
                                        </Label>
                                        <Input
                                            id="lastname"
                                            placeholder="Masukkan nama belakang"
                                            value={formData.lastname}
                                            onChange={(event) => setFormData({ ...formData, lastname: event.target.value })}
                                            disabled={isSubmitting}
                                            className="h-11 bg-white text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                                            Username <span className="text-rose-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <AtSign className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="username"
                                                placeholder="Masukkan username"
                                                value={formData.username}
                                                onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                                                disabled={isSubmitting}
                                                className="h-11 bg-white pl-10 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden rounded-md border-slate-200 shadow-sm">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                                <CardTitle className="text-base text-slate-900">Informasi Akun</CardTitle>
                                <CardDescription>Data akun yang dikelola oleh sistem.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 py-5">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                            Alamat Email
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="email"
                                                value={user?.email || '-'}
                                                disabled
                                                className="h-11 cursor-not-allowed bg-slate-50 pl-10 text-sm text-slate-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-sm font-medium text-slate-700">
                                            Hak Akses / Role
                                        </Label>
                                        <div className="relative">
                                            <Shield className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="role"
                                                value={roleName}
                                                disabled
                                                className="h-11 cursor-not-allowed bg-slate-50 pl-10 text-sm text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11 min-w-[168px] cursor-pointer rounded-md px-6 btn-primary-orange!"
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingState variant="inline" text={null} />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
