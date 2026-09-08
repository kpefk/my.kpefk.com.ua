'use client'

import { useState } from 'react'

import { Ellipsis, Loader2, MailPlus, RefreshCw } from 'lucide-react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { useProvisionAllStudentEmails, useSyncStudents } from '../api'

interface StudentActionsMenuProps {
	studentIds: string[]
	canProvision: boolean
}

export function StudentActionsMenu({
	studentIds,
	canProvision,
}: StudentActionsMenuProps) {
	const provision = useProvisionAllStudentEmails()
	const sync = useSyncStudents()
	const [provisionOpen, setProvisionOpen] = useState(false)
	const [syncOpen, setSyncOpen] = useState(false)

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant='outline'
						size='icon'
						aria-label='Дії зі студентами'
						disabled={provision.isPending || sync.isPending}
					>
						{provision.isPending || sync.isPending ? (
							<Loader2 className='animate-spin' />
						) : (
							<Ellipsis />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-64'>
					{canProvision && (
						<DropdownMenuItem
							disabled={studentIds.length === 0 || provision.isPending}
							onSelect={event => {
								event.preventDefault()
								setProvisionOpen(true)
							}}
						>
							<MailPlus />
							Згенерувати Email для {studentIds.length} студентів
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						disabled={sync.isPending}
						onSelect={event => {
							event.preventDefault()
							setSyncOpen(true)
						}}
					>
						<RefreshCw />
						Синхронізувати з ЄДЕБО
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={provisionOpen} onOpenChange={setProvisionOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Масове створення корпоративної пошти</AlertDialogTitle>
						<AlertDialogDescription>
							Для {studentIds.length} відфільтрованих студентів без корпоративної
							пошти буде створено акаунт Google Workspace. Операція може зайняти
							кілька хвилин.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Скасувати</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setProvisionOpen(false)
								provision.mutate(studentIds)
							}}
						>
							Створити пошту
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={syncOpen} onOpenChange={setSyncOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Синхронізація студентів з ЄДЕБО</AlertDialogTitle>
						<AlertDialogDescription>
							Буде запущено оновлення даних студентів з реєстру ЄДЕБО. Це може зайняти
							кілька хвилин.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Скасувати</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setSyncOpen(false)
								sync.mutate()
							}}
						>
							Синхронізувати
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
