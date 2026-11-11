import type { ColumnDef } from "@tanstack/react-table"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useMemo, useState } from "react"
import { describe, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { renderWithProviders } from "@test/support/providers"

import {
  countByTab,
  DataTableColumnHeader,
  type DataTableFeatures,
  DataTablePagination,
  DataTableTabs,
  DataTableView,
  useDataTable,
} from "@/components/data-table/data-table"

type Row = { id: string; name: string; archived: boolean }

const columns: ColumnDef<DataTableFeatures, Row, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
]

const sized: ColumnDef<DataTableFeatures, Row, unknown>[] = [
  { accessorKey: "name", header: "Name", size: 150 },
  { accessorKey: "id", header: "Id" },
]

const rows = (count: number, offset = 0): Row[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `r${i + offset}`,
    name: `Person ${String(i + offset + 1).padStart(3, "0")}`,
    archived: (i + offset) % 5 === 0,
  }))

function List({
  data,
  search = "",
  emptyMessage,
}: {
  data: Row[]
  search?: string
  emptyMessage?: string
}) {
  const found = useMemo(
    () => data.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  )

  const { table } = useDataTable({ data: found, columns, getRowId: (r) => r.id })

  return (
    <>
      <DataTableView table={table} emptyMessage={emptyMessage} />
      <DataTablePagination table={table} />
    </>
  )
}

const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent)

test("a column keeps the width it names, also 150; others take their content's width", () => {
  function Sized() {
    const { table } = useDataTable({ data: rows(1), columns: sized, getRowId: (r) => r.id })

    return <DataTableView table={table} />
  }

  renderWithProviders(<Sized />)
  expect(screen.getByRole("columnheader", { name: "Name" })).toHaveStyle({ width: "150px" })
  expect(screen.getByRole("columnheader", { name: "Id" }).style.width).toBe("")
})

describe("sorting", () => {
  test("a sortable header toggles ascending and descending and says which", async () => {
    renderWithProviders(<List data={rows(3)} />)
    const header = screen.getByRole("columnheader", { name: "Name" })
    expect(header).not.toHaveAttribute("aria-sort")
    await userEvent.click(within(header).getByRole("button", { name: "Sort by Name" }))
    expect(names()).toEqual(["Person 001", "Person 002", "Person 003"])
    expect(header).toHaveAttribute("aria-sort", "ascending")
    await userEvent.click(within(header).getByRole("button", { name: "Sort by Name" }))
    expect(names()).toEqual(["Person 003", "Person 002", "Person 001"])
    expect(header).toHaveAttribute("aria-sort", "descending")
  })
})

describe("paging in the browser", () => {
  test.each([
    ["en", "Showing 1–10 of 23", "Page 1 of 3"],
    ["de", "1–10 von 23", "Seite 1 von 3"],
  ] as const)("23 rows in %s", async (locale: Locale, showing, page) => {
    renderWithProviders(<List data={rows(23)} />, { locale })
    expect(screen.getByText(new RegExp(showing))).toBeInTheDocument()
    expect(screen.getByText(page)).toBeInTheDocument()
  })

  test("Previous is disabled on the first page, Next on the last", async () => {
    renderWithProviders(<List data={rows(23)} />)
    const previous = screen.getByRole("button", { name: "Previous page" })
    const next = screen.getByRole("button", { name: "Next page" })
    expect(previous).toBeDisabled()
    await userEvent.click(next)
    await userEvent.click(next)
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument()
    expect(screen.getByText("Showing 21–23 of 23")).toBeInTheDocument()
    expect(next).toBeDisabled()
    expect(previous).toBeEnabled()
  })

  test("no match says 'No results.' or the given message", () => {
    const { unmount } = renderWithProviders(<List data={rows(3)} search="nobody" />)
    expect(screen.getAllByText("No results.")).toHaveLength(2)
    unmount()
    renderWithProviders(<List data={rows(3)} search="nobody" emptyMessage="No people match." />)
    expect(screen.getByText("No people match.")).toBeInTheDocument()
  })
})

describe("status tabs", () => {
  function Tabbed({ search }: { search: string }) {
    const all = rows(10)
    const [tab, setTab] = useState<"active" | "archived" | "all">("active")

    const counts = countByTab(all, {
      active: (r) => !r.archived,
      archived: (r) => r.archived,
      all: () => true,
    })

    const shown = all.filter((r) => tab === "all" || (tab === "archived") === r.archived)

    return (
      <>
        <DataTableTabs
          value={tab}
          onValueChange={setTab}
          tabs={[
            { value: "active", label: `Active (${counts.active})` },
            { value: "archived", label: `Archived (${counts.archived})` },
            { value: "all", label: `All (${counts.all})` },
          ]}
        />
        <List data={shown} search={search} />
      </>
    )
  }

  test("counts ignore the search", async () => {
    renderWithProviders(<Tabbed search="Person 007" />)
    expect(screen.getByRole("tab", { name: "Active (8)" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Archived (2)" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "All (10)" })).toBeInTheDocument()
    expect(names()).toEqual(["Person 007"])
    await userEvent.click(screen.getByRole("tab", { name: "Archived (2)" }))
    expect(screen.getAllByText("No results.").length).toBeGreaterThan(0)
  })
})

describe("manual mode (paged by the API)", () => {
  function Paged({ onPageChange }: { onPageChange: (page: number) => void }) {
    const data = rows(25, 25).reverse()

    const { table } = useDataTable({
      data,
      columns,
      getRowId: (r) => r.id,
      pageSize: 25,
      initialSorting: [{ id: "name", desc: false }],
      manual: { rowCount: 121, page: 2, onPageChange },
    })

    return (
      <>
        <DataTableView table={table} />
        <DataTablePagination table={table} />
      </>
    )
  }

  test("renders the given rows in order with the API's totals; Next asks for page 3", async () => {
    const onPageChange = vi.fn()
    renderWithProviders(<Paged onPageChange={onPageChange} />)
    const shown = names()
    expect(shown).toHaveLength(25)
    expect(shown[0]).toBe("Person 050")
    expect(shown[24]).toBe("Person 026")
    expect(screen.getByText("Showing 26–50 of 121")).toBeInTheDocument()
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Next page" }))
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(3)
    expect(within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row")).toHaveLength(25)
  })
})
