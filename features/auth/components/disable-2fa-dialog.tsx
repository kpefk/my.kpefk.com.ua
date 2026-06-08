'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import type { TwoFactorMethod } from '@/lib/services/auth.service'
import { useEmailDisable2FA, useTotpDisable } from '../api/security'

interface Disable2FADialogProps {
  open: boolean
  onClose: () => void
  method: TwoFactorMethod
}

export function Disable2FADialog({ open, onClose, method }: Disable2FADialogProps) {
  const [code, setCode] = useState('')
  const emailDisable = useEmailDisable2FA()
  const totpDisable = useTotpDisable()

  const isPending = emailDisable.isPending || totpDisable.isPending
  const hint =
    method === 'EMAIL'
      ? 'Введіть код, який щойно надійшов на вашу пошту:'
      : 'Введіть поточний код з застосунку Authenticator:'

  const handleDisable = () => {
    if (code.length < 6) return
    if (method === 'EMAIL') {
      emailDisable.mutate(code, { onSuccess: onClose })
    } else {
      totpDisable.mutate(code, { onSuccess: onClose })
    }
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) { setCode(''); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Вимкнути двофакторну автентифікацію</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-muted-foreground">{hint}</p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            className="text-center font-mono text-xl tracking-[0.5em] h-12"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleDisable()}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button
            variant="destructive"
            disabled={code.length < 6 || isPending}
            onClick={handleDisable}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Вимкнути'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
