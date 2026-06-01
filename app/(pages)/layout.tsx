import type { Metadata } from 'next'
import { AuthGuard } from '@/components/dashboard/auth-guard'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const metadata: Metadata = {
	title: {
		template: '%s | MyKPEFK',
		default: 'Особистий кабінет | MyKPEFK'
	}
}

/**
 * Dashboard Layout — SERVER Component.
 *
 * Архітектурні рішення:
 * 1. Залишається Server Component → може експортувати metadata
 * 2. НЕ містить hooks, useState, useEffect — вони заборонені в SC
 * 3. Делегує перевірку авторизації клієнтському AuthGuard
 * 4. DashboardShell (client) рендерить інтерактивний UI (sidebar, header)
 */
export default function DashboardLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<AuthGuard>
			<DashboardShell>{children}</DashboardShell>
		</AuthGuard>
	)
}
