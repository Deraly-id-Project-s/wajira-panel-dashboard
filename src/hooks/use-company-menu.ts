import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { companyMenuMap } from '@/configs/menu/company-menu.map';
import { MenuItem } from '@/types/menu.types';
import { Company } from '@/services/company.service';
import { AuthService } from '@/features/auth/services/auth.service';
import { setStoredPermissions } from '@/lib/session/storage';

const ALWAYS_ALLOWED = ['Dashboard', 'Settings', 'Pengaturan'];

const MENU_PERMISSION_MAP: Record<string, string[]> = {
    'Master Data': ['master-data:list'],
    'Administrasi': ['transaction:list'],
    'Warehouse': ['warehouse:list'],
    'Finance': ['finance:list'],
    'Laporan': ['report:list'],
    'Manajemen Pengguna': ['user:list', 'role:list', 'permission:list'],
};

export function useCompanyMenu(companies: Company[]): { menus: MenuItem[], isLoading: boolean } {
    const router = useRouter();
    const slugQuery = router.query.slug;
    const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';

    const { companyId } = useCompany();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Find the exact company based on ID from Context, to get its safe slug or name
    const currentCompany = companies.find((c) => String(c.id) === String(companyId));

    useEffect(() => {
        setIsLoading(true);
        AuthService.getPermissions()
            .then((perms) => {
                setPermissions(perms || []);
                setStoredPermissions(perms || []);
            })
            .catch((err) => {
                console.error('Failed to fetch permissions test:', err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [companyId]);

    const mappedMenus = useMemo(() => {
        if (!currentCompany) return [];

        // Normalize name/slug to match key in map
        const compSlug = (currentCompany.slug || currentCompany.name || '').toLowerCase();
        const isTransindo = compSlug.includes('transindo');
        const isYanotama = compSlug.includes('yanotama');

        // Mapping logik
        let baseMenus: MenuItem[] = [];
        if (isTransindo) {
            baseMenus = companyMenuMap['transindo'](slug);
        } else if (isYanotama) {
            baseMenus = companyMenuMap['yanotama'](slug);
        } else {
            baseMenus = companyMenuMap.default(slug);
        }

        // Keep stock-perlengkapan available for Yanotama, while preserving the old restriction for other companies.
        if (!isTransindo && !isYanotama) {
            baseMenus = baseMenus.map((menu) => {
                if (menu.label === 'Warehouse' && menu.children) {
                    return {
                        ...menu,
                        children: menu.children.filter(
                            (child) =>
                                child.label.toLowerCase() !== 'perlengkapan masuk' &&
                                child.label.toLowerCase() !== 'perlengkapan keluar' &&
                                child.label.toLowerCase() !== 'stock perlengkapan' &&
                                child.label.toLowerCase() !== 'stok perlengkapan' &&
                                child.label.toLowerCase() !== 'perlengkapan'
                        ),
                    };
                }
                return menu;
            });
        }

        // Filter menus and submenus based on user permissions
        return baseMenus
            .map((menu) => {
                if (menu.children) {
                    let filteredChildren = menu.children;
                    if (menu.label === 'Manajemen Pengguna') {
                        filteredChildren = menu.children.filter((child) => {
                            if (child.label === 'Pengguna') return permissions.includes('user:list');
                            if (child.label === 'Hak Akses') return permissions.includes('role:list');
                            if (child.label === 'Izin Akses') return permissions.includes('permission:list');
                            return true;
                        });
                    }
                    return {
                        ...menu,
                        children: filteredChildren,
                    };
                }
                return menu;
            })
            .filter((menu) => {
                if (ALWAYS_ALLOWED.includes(menu.label)) return true;
                const required = MENU_PERMISSION_MAP[menu.label];
                if (required) {
                    return required.some((perm) => permissions.includes(perm));
                }
                return false;
            });
    }, [currentCompany, slug, permissions]);

    return { menus: mappedMenus, isLoading };
}
