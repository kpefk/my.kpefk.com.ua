import type { Metadata } from 'next'
import { Fira_Code, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Preloader } from '@/components/preloader'
import { cn } from '@/lib/utils'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const firaCode = Fira_Code({
	variable: '--font-mono',
	subsets: ['latin', 'cyrillic'],
	display: 'swap'
})

export const metadata: Metadata = {
	title: {
		template: '%s | MyKPEFK',
		default: 'MyKPEFK — цифрова платформа КПЕФК ЛНТУ'
	},
	description:
		'MyKPEFK — цифрова платформа для студентів та викладачів КПЕФК ЛНТУ. Розклад занять, електронний кабінет, успішність та керування навчальним процесом онлайн.',
	keywords: [
		'КПЕФК',
		'КПЕФК ЛНТУ',
		'Ковельський коледж',
		'коледж Ковель',
		'студентський портал КПЕФК',
		'розклад занять КПЕФК',
		'електронний кабінет студента',
		'навчальний портал ЛНТУ',
		'особистий кабінет студента',
		'успішність студента онлайн'
	],
	icons: {
		icon: 'icons/favicon.ico'
	},
	category: 'education',
	alternates: {
		canonical: 'https://my.kpefk.com.ua',
		languages: {
			'uk-UA': 'https://my.kpefk.com.ua',
			'x-default': 'https://my.kpefk.com.ua'
		}
	},
	authors: [
		{ name: 'MyKPEFK Dev Team', url: 'https://github.com/kpefk' },
		{ name: 'Tymchenko Serhii', url: 'https://github.com/ts03-coder' },
		{ name: 'mickey', url: 'https://github.com/mccormickk' }
	],
	creator: 'MyKPEFK Dev Team',
	publisher: 'ВСП "Ковельський промислово-економічний фаховий коледж Луцького НТУ"',
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-snippet': -1,
			'max-image-preview': 'large'
		}
	},
	openGraph: {
		type: 'website',
		locale: 'uk_UA',
		url: 'https://my.kpefk.com.ua',
		siteName: 'MyKPEFK',
		title: 'MyKPEFK — цифрова платформа КПЕФК ЛНТУ',
		description:
			'MyKPEFK — цифрова платформа для студентів та викладачів КПЕФК ЛНТУ. Розклад занять, електронний кабінет, успішність та керування навчальним процесом онлайн.',
		images: [
			{
				url: 'https://my.kpefk.com.ua/og-image.png',
				width: 1200,
				height: 630,
				alt: 'MyKPEFK — цифрова платформа КПЕФК ЛНТУ',
				type: 'image/png'
			}
		]
	},
	verification: {
		google: process.env.GOOGLE_SITE_VERIFICATION
	}
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang='uk'
			suppressHydrationWarning
			className={cn('h-full', 'antialiased', firaCode.variable, 'font-sans', inter.variable)}
		>
			<body className='flex min-h-full flex-col'>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange
				>
					<AuthProvider>
						<Preloader />
						{children}
						<Toaster position='top-right' />
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
