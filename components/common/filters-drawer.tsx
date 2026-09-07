'use client'

import { useState } from 'react'
import { Funnel, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FiltersDrawerProps {
  /** Кількість активних (не-дефолтних) фільтрів — бейдж на кнопці. */
  activeCount: number
  onReset: () => void
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

/**
 * Спільна оболонка фільтрів: кнопка з іконкою лійки + бокова панель із полями.
 * Поля передаються через `children` (зазвичай у {@link FilterField}).
 */
export function FiltersDrawer({
  activeCount,
  onReset,
  children,
  title = 'Фільтри',
  description = 'Уточніть перелік за наведеними параметрами.',
  className,
}: FiltersDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn('gap-1.5', className)}
      >
        <Funnel size={16} />
        {title}
        {activeCount > 0 && (
          <Badge className="ml-0.5 h-5 min-w-5 px-1 text-[11px]">{activeCount}</Badge>
        )}
      </Button>

      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>

          <DrawerFooter className="border-t border-border flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onReset}
              disabled={activeCount === 0}
            >
              <X className="w-4 h-4 mr-1.5" />
              Скинути
            </Button>
            <DrawerClose asChild>
              <Button className="flex-1">Готово</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

/** Поле фільтра: підпис + контрол. */
export function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
