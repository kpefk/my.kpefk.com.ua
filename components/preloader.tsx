"use client"

import { AnimatePresence, motion, type Variants } from "framer-motion"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"

const overlayVariants: Variants = {
  visible: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
}

const logoVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1], delay: 0.15 },
  },
}

export function Preloader() {
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const id = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(id)
  }, [])

  const logoSrc = useMemo(() => {
    if (!mounted) return "/logo-light.png"
    return resolvedTheme === "dark" ? "/logo-light.png" : "/logo-dark.png"
  }, [mounted, resolvedTheme])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          variants={overlayVariants}
          initial="visible"
          exit="exit"
        >
          <div className="relative h-[140px] w-[140px]">
            <div className="pointer-events-none absolute inset-[6px] z-[2] rounded-[36px] border border-foreground/15" />

            <div className="absolute inset-[6px] z-[1] overflow-hidden rounded-[36px]">
              <motion.div
                className="absolute h-[200%] w-[200%]"
                style={{
                  top: "-50%",
                  left: "-50%",
                  background:
                    "conic-gradient(from 0deg, transparent 0%, transparent 40%, color-mix(in oklch, var(--primary) 50%, transparent) 70%, var(--primary) 100%)",
                  transformOrigin: "50% 50%",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <motion.div
              className="absolute inset-0 z-[3] flex items-center justify-center"
              variants={logoVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="absolute inset-[10px] z-[-1] rounded-[30px] bg-background" />

              <Image
                src={logoSrc}
                alt="Логотип"
                width={120}
                height={120}
                priority
                className="object-contain"
              />
            </motion.div>
          </div>

          <motion.div
            className="absolute h-[140px] w-[140px] rounded-[42px] border border-primary/30"
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}