"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { type PersonRow, personRowQuery } from "./api"
import { PersonSheet } from "./person-sheet"

type Selected = { row: PersonRow; key: string; version: number }

export function useSelectedPerson(filterKey: string, rows: PersonRow[] | undefined) {
  const [selected, setSelected] = useState<Selected | null>(null)
  const open = selected?.key === filterKey ? selected : null
  const listed = rows?.find((row) => row.person.id === open?.row.person.id)

  if (open && listed && listed !== open.row) {
    setSelected({ ...open, row: listed })
  }

  return {
    open,
    listed,
    select: (row: PersonRow) => setSelected({ row, key: filterKey, version: 0 }),
    close: () => setSelected(null),
    changeStatus: (row: PersonRow) => {
      if (open) {
        setSelected({ ...open, row, version: open.version + 1 })
      }
    },
  }
}

export function SelectedPersonSheet({
  selected,
  listed,
  onClose,
  onStatusChange,
}: {
  selected: Selected
  listed: PersonRow | undefined
  onClose: () => void
  onStatusChange: (row: PersonRow) => void
}) {
  const elsewhere = useQuery({
    ...personRowQuery(selected.row.person, selected.version),
    enabled: listed === undefined,
  })

  return (
    <PersonSheet
      row={listed ?? elsewhere.data ?? selected.row}
      onOpenChange={(open) => !open && onClose()}
      onStatusChange={onStatusChange}
    />
  )
}
