"use client"

import React, { useEffect, useState } from "react"
import { AnimatePresence, motion, MotionConfig } from "framer-motion"
import { ChevronDownIcon, X } from "lucide-react"

export type TSelectData = {
  id: string
  label: string
  value: string
  description?: string
  icon?: string
  disabled?: boolean
  custom?: React.ReactNode
}

type SelectProps = {
  data?: TSelectData[]
  onChange?: (value: string) => void
  defaultValue?: string
  placeholder?: string
}

const Select = ({ data, defaultValue, onChange, placeholder = "בחר סינון" }: SelectProps) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<TSelectData | undefined>(undefined)

  useEffect(() => {
    if (defaultValue) {
      const item = data?.find((i) => i.value === defaultValue)
      if (item) setSelected(item)
    } else {
      setSelected(data?.[0])
    }
  }, [defaultValue, data])

  const onSelect = (value: string) => {
    const item = data?.find((i) => i.value === value)
    setSelected(item as TSelectData)
    onChange?.(value)
    setOpen(false)
  }

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
    >
      <motion.div className="flex items-center justify-start" dir="rtl">
        <AnimatePresence mode="popLayout">
          {!open ? (
            <motion.div
              whileTap={{ scale: 0.95 }}
              animate={{ borderRadius: 30 }}
              layout
              layoutId="role-dropdown"
              onTap={() => setOpen(true)}
              className="overflow-hidden rounded-[30px] border border-input bg-background shadow-sm cursor-pointer"
            >
              <SelectItem item={selected} placeholder={placeholder} />
            </motion.div>
          ) : (
            <motion.div
              layout
              animate={{ borderRadius: 20 }}
              layoutId="role-dropdown"
              className="overflow-hidden rounded-[20px] w-full max-w-xs border border-input bg-background py-2 shadow-md"
              ref={ref}
            >
              <Head setOpen={setOpen} title={placeholder} />
              <div className="w-full overflow-y-auto max-h-72">
                {data?.map((item) => (
                  <SelectItem
                    order={item?.value}
                    noDescription={false}
                    key={item.id}
                    item={item}
                    onChange={onSelect}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  )
}

export default Select

const Head = ({ setOpen, title }: { setOpen: (open: boolean) => void; title: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ delay: 0.08 }}
    layout
    className="flex items-center justify-between p-4"
  >
    <motion.strong layout className="text-foreground text-sm">
      {title}
    </motion.strong>
    <motion.button
      onTap={() => setOpen(false)}
      className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary"
    >
      <X className="text-secondary-foreground" size={12} />
    </motion.button>
  </motion.div>
)

type SelectItemProps = {
  item?: TSelectData
  noDescription?: boolean
  order?: string
  onChange?: (value: string) => void
  placeholder?: string
}

const animation = {
  hidden: { opacity: 0, y: 8 },
  visible: (custom: string) => ({
    opacity: 1,
    y: 0,
    transition: { delay: (parseInt(custom) || 0) * 0.04, duration: 0.25 },
  }),
  exit: (custom: string) => ({
    opacity: 0,
    y: 8,
    transition: { delay: (parseInt(custom) || 0) * 0.02 },
  }),
}

const SelectItem = ({ item, noDescription = true, order, onChange, placeholder }: SelectItemProps) => (
  <motion.div
    className={`group flex cursor-pointer items-center justify-between gap-2 hover:bg-accent hover:text-accent-foreground ${
      noDescription ? "p-2" : "p-3 py-2"
    }`}
    variants={animation}
    initial="hidden"
    animate="visible"
    exit="exit"
    custom={order ?? "0"}
    onTap={() => onChange?.(order as string)}
  >
    <div className="flex items-center gap-3">
      <motion.div
        layout
        layoutId={`sel-icon-${item?.id}`}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-input text-lg flex-none"
      >
        {item?.icon}
      </motion.div>
      <motion.div layout className="flex flex-col">
        <motion.strong
          layoutId={`sel-label-${item?.id}`}
          className="text-sm font-semibold text-foreground"
        >
          {item?.label ?? placeholder}
        </motion.strong>
        {!noDescription && (
          <span className="text-xs text-muted-foreground">{item?.description}</span>
        )}
      </motion.div>
    </div>
    {noDescription && (
      <motion.div layout className="flex items-center justify-center gap-2 ps-3">
        <ChevronDownIcon className="text-foreground" size={18} />
      </motion.div>
    )}
  </motion.div>
)
