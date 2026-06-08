'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useTotpSetup, useTotpVerifySetup, type TotpSetupDto } from '../api/security'

type Step = 'qr' | 'confirm'

interface TotpSetupDialogProps {
  open: boolean
  onClose: () => void
}

export function TotpSetupDialog({ open, onClose }: TotpSetupDialogProps) {
  const [step, setStep] = useState<Step>('qr')
  const [setupData, setSetupData] = useState<TotpSetupDto | null>(null)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const setup = useTotpSetup()
  const verify = useTotpVerifySetup()

  // Initiate setup when dialog opens
  useEffect(() => {
    if (!open) {
      setStep('qr')
      setCode('')
      setSetupData(null)
      return
    }
    setup.mutate(undefined, {
      onSuccess: (data) => setSetupData(data),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleCopySecret = () => {
    if (!setupData) return
    navigator.clipboard.writeText(setupData.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = () => {
    if (code.length !== 6) return
    verify.mutate(code, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        {step === 'qr' ? (
          <>
            <DialogHeader>
              <DialogTitle>Налаштування Google Authenticator</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5 py-2">
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Встановіть <strong className="text-foreground">Google Authenticator</strong> або <strong className="text-foreground">Authy</strong> на телефон</li>
                <li>Відскануйте QR-код або введіть ключ вручну</li>
              </ol>

              {/* QR code */}
              <div className="flex justify-center">
                {setup.isPending || !setupData ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center border border-border rounded-lg bg-muted/20">
                    <Loader2 size={32} className="animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="TOTP QR Code"
                    width={200}
                    height={200}
                    className="rounded-lg border border-border"
                  />
                )}
              </div>

              {/* Manual key */}
              {setupData && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Або введіть ключ вручну:</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded-md break-all">
                      {setupData.secret.match(/.{1,4}/g)?.join(' ')}
                    </code>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="shrink-0 h-9 w-9"
                      onClick={handleCopySecret}
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Скасувати</Button>
              <Button disabled={!setupData || setup.isPending} onClick={() => setStep('confirm')}>
                Далі →
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Підтвердити Authenticator</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <p className="text-sm text-muted-foreground">
                Введіть 6-значний код з застосунку для підтвердження:
              </p>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                className="text-center font-mono text-xl tracking-[0.5em] h-12"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('qr')} className="sm:mr-auto">
                ← Назад
              </Button>
              <Button
                disabled={code.length !== 6 || verify.isPending}
                onClick={handleConfirm}
              >
                {verify.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Підтвердити'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
