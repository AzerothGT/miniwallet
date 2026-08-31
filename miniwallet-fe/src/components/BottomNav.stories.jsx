import { BottomNav } from './BottomNav.jsx'

export default {
  title: 'Navigation/BottomNav',
  component: BottomNav,
  decorators: [
    (Story) => (
      <div className="bg-canvas max-w-[24rem] pt-16">
        <Story />
      </div>
    ),
  ],
}

/**
 * The active item expands into a labelled lime pill while the others stay as
 * bare icons, so the current location is conveyed by shape and text rather than
 * colour alone. Which item is active depends on the router; MemoryRouter starts
 * at "/", so nothing is highlighted here.
 */
export const Default = {}

export const OnDashboard = {
  parameters: {
    reactRouter: { initialEntries: ['/dashboard'] },
  },
}
