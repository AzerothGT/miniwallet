import { useState } from 'react'
import { Pagination } from './Pagination.jsx'

export default {
  title: 'Navigation/Pagination',
  component: Pagination,
  argTypes: {
    onPageChange: { control: false },
  },
  args: {
    meta: { current_page: 1, last_page: 5, total: 68 },
  },
  decorators: [
    (Story) => (
      <div className="card max-w-[24rem]">
        <Story />
      </div>
    ),
  ],
}

/** Clicking a page updates the current page, so the window logic is visible. */
function Interactive({ meta, ...args }) {
  const [page, setPage] = useState(meta.current_page)

  return (
    <Pagination
      {...args}
      meta={{ ...meta, current_page: page }}
      onPageChange={setPage}
    />
  )
}

export const FewPages = {
  render: Interactive,
  args: { meta: { current_page: 1, last_page: 5, total: 68 } },
}

/** Seven pages or fewer are listed in full; beyond that the window collapses. */
export const AtBoundary = {
  render: Interactive,
  args: { meta: { current_page: 4, last_page: 7, total: 98 } },
}

/**
 * With many pages, first and last stay reachable and one neighbour flanks the
 * current page. Ellipses are inert text, so there is nothing misleading to click.
 */
export const ManyPagesStart = {
  render: Interactive,
  args: { meta: { current_page: 1, last_page: 24, total: 352 } },
}

export const ManyPagesMiddle = {
  render: Interactive,
  args: { meta: { current_page: 12, last_page: 24, total: 352 } },
}

export const ManyPagesEnd = {
  render: Interactive,
  args: { meta: { current_page: 24, last_page: 24, total: 352 } },
}

/** Renders nothing on a single page, so callers need no conditional. */
export const SinglePageRendersNothing = {
  args: { meta: { current_page: 1, last_page: 1, total: 7 } },
}
