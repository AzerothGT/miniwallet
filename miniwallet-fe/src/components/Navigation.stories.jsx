import {
  AdminBottomNav,
  AdminSideNav,
  BottomNav,
  SideNav,
} from './Navigation.jsx'

export default {
  title: 'Navigation/AppNavigation',
  parameters: {
    layout: 'fullscreen',
  },
}

/**
 * Bottom bar for narrow screens. Hidden at `lg` and up in the real app, so this
 * story is best viewed in a narrow viewport.
 */
export const Bottom = {
  render: () => (
    <div className="bg-canvas max-w-[24rem] pt-16">
      <BottomNav />
    </div>
  ),
  parameters: {
    reactRouter: { initialEntries: ['/dashboard'] },
  },
}

/**
 * Sidebar for desktop. Only renders at `lg` and up, so a narrow preview will
 * appear empty — that is the intended behaviour, not a broken story.
 */
export const Side = {
  render: () => (
    <div className="bg-canvas flex min-h-dvh">
      <SideNav />
      <div className="text-ink-faint flex flex-1 items-center justify-center text-sm">
        Area konten
      </div>
    </div>
  ),
  parameters: {
    reactRouter: { initialEntries: ['/history'] },
  },
}

/**
 * Both together, as the app renders them. Only one is ever visible: resizing the
 * preview swaps which, and they are never announced to assistive tech at once.
 */
export const Responsive = {
  render: () => (
    <div className="bg-canvas flex min-h-dvh">
      <SideNav />
      <div className="flex min-h-dvh flex-1 flex-col">
        <div className="text-ink-faint flex flex-1 items-center justify-center text-sm">
          Ubah lebar preview untuk menukar navigasi
        </div>
        <BottomNav />
      </div>
    </div>
  ),
  parameters: {
    reactRouter: { initialEntries: ['/report'] },
  },
}

/**
 * Administration navigation.
 *
 * A separate item list rather than a filtered copy of the wallet one: an
 * administrator is doing a different job, and mixing wallet actions into an
 * oversight tool would blur which account the figures belong to.
 */
export const AdminSide = {
  render: () => (
    <div className="bg-canvas flex min-h-dvh">
      <AdminSideNav />
      <div className="text-ink-faint flex flex-1 items-center justify-center text-sm">
        Area admin
      </div>
    </div>
  ),
  parameters: {
    reactRouter: { initialEntries: ['/admin/users'] },
  },
}

export const AdminBottom = {
  render: () => (
    <div className="bg-canvas max-w-[24rem] pt-16">
      <AdminBottomNav />
    </div>
  ),
  parameters: {
    reactRouter: { initialEntries: ['/admin'] },
  },
}
