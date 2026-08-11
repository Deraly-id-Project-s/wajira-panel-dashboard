import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {

    Upload,
    Mail,
    Shield
} from 'lucide-react';
import { useAuthMe } from '@/features/auth/hooks/use-auth-me';
import { AuthService } from '@/features/auth/services/auth.service';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { ParsedImage } from '@/components/ui/parsed-image';
import { getParsedImageUrl } from '@/lib/utils/image';


export default function ProfilePage() {
    const { data: profileData, isLoading, refetch } = useAuthMe();
    const user = profileData?.data;

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State (firstname, lastname and username are editable as per update API body)
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        username: '',
    });

    // Avatar upload states
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                username: user.username || '',
            });
            // Reset local avatar selection when user data changes/reloads
            setAvatarFile(null);
            setAvatarPreview(null);
        }
    }, [user]);

    // Clean up object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const initials = (user?.name || [user?.firstname, user?.lastname].filter(Boolean).join(' ') || '-')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US';

    const roleName = user?.roles?.[0]?.name
        ? user.roles[0].name.charAt(0).toUpperCase() + user.roles[0].name.slice(1)
        : 'User';

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const updateData = {
                name: [formData.firstname.trim(), formData.lastname.trim()].filter(Boolean).join(' '),
                firstname: formData.firstname.trim(),
                lastname: formData.lastname.trim(),
                username: formData.username.trim(),
                avatar: avatarFile,
            };

            await AuthService.updateProfile(user.id, updateData);
            toast.success('Profil berhasil diperbarui!');
            refetch(); // Refresh the profile data
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
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Profil Saya</h1>
                    <p className="text-sm text-muted-foreground">Kelola dan perbarui detail informasi profil Anda.</p>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* LEFT COLUMN: Foto Profil */}
                    <div className="lg:col-span-1">
                        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="text-base font-semibold text-slate-900">Foto Profil</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Unggah foto profil terbaru Anda.</p>
                            </div>

                            <div className="flex flex-col items-center">
                                {(avatarPreview || user?.avatar) ? (
                                    <div className="mb-5 flex justify-center">
                                        <ParsedImage
                                            src={avatarPreview || user?.avatar}
                                            alt="Avatar"
                                            className="h-28 w-28 rounded-full object-cover border-4 border-slate-200 shadow-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="mb-5 flex justify-center">
                                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-200 bg-slate-100 text-3xl font-bold text-slate-800 shadow-sm">
                                            {initials}
                                        </div>
                                    </div>
                                )}

                                {/* Drag/Click File Uploader Box */}
                                <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-5 text-center hover:bg-slate-100/70 transition">
                                    <Upload className="mb-2 h-6 w-6 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">
                                        {avatarFile ? avatarFile.name : 'Klik untuk upload gambar'}
                                    </span>
                                    <span className="mt-1 text-xs text-slate-400">Format PNG, JPG maksimal 2MB</span>
                                    <input autoComplete="off"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0] ?? null;
                                            if (file && file.size > 2 * 1024 * 1024) {
                                                toast.error('Ukuran file gambar maksimal 2MB');
                                                event.target.value = ''; // Reset input element value
                                                return;
                                            }
                                            setAvatarFile(file);
                                            if (file) {
                                                setAvatarPreview(URL.createObjectURL(file));
                                            } else {
                                                setAvatarPreview(null);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Detail Pribadi & Informasi Akun */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Card 2: Detail Pribadi */}
                        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="text-base font-semibold text-slate-900">Detail Pribadi</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Informasi nama dan identitas Anda.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstname" className="text-sm font-medium text-slate-700">
                                        Nama Depan <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="firstname"
                                        placeholder="Masukkan nama depan"
                                        value={formData.firstname}
                                        onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                        disabled={isSubmitting}
                                        className="bg-white border-slate-200 text-sm shadow-sm h-11 focus-visible:ring-slate-400 rounded-md"
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
                                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                        disabled={isSubmitting}
                                        className="bg-white border-slate-200 text-sm shadow-sm h-11 focus-visible:ring-slate-400 rounded-md"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                                        Username <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="username"
                                        placeholder="Masukkan username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        disabled={isSubmitting}
                                        className="bg-white border-slate-200 text-sm shadow-sm h-11 focus-visible:ring-slate-400 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Informasi Akun */}
                        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="text-base font-semibold text-slate-900">Informasi Akun</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Detail sistem dan hak akses akun Anda.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                        Alamat Email
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            value={user?.email || '-'}
                                            disabled
                                            className="bg-slate-50 border-slate-200 text-slate-500 text-sm shadow-sm h-11 cursor-not-allowed pl-10 rounded-md"
                                        />
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-sm font-medium text-slate-700">
                                        Hak Akses / Role
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="role"
                                            value={roleName}
                                            disabled
                                            className="bg-slate-50 border-slate-200 text-slate-500 text-sm shadow-sm h-11 cursor-not-allowed pl-10 rounded-md"
                                        />
                                        <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#1e3a5f] hover:bg-[#152e4d] text-white min-w-[140px] h-11 shadow-sm px-6 rounded-md cursor-pointer font-medium"
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingState variant="inline" text={null} />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan Perubahan'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
