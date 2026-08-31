import { MemoryRouter } from 'react-router-dom'
// Tailwind and the design tokens: without this the stories render unstyled.
import '../src/index.css'

/** @type {import('@storybook/react-vite').Preview} */
const preview = {
  parameters: {
    controls: { expanded: true },

    backgrounds: {
      options: {
        canvas: { name: 'Canvas', value: '#f2f4f1' },
        paper: { name: 'Paper', value: '#ffffff' },
        forest: { name: 'Forest', value: '#06210f' },
      },
    },
  },

  initialGlobals: {
    backgrounds: { value: 'canvas' },
  },

  decorators: [
    // Several components render <Link> or <NavLink>, which throw outside a
    // router. `initialEntries` can be overridden per story via parameters.
    (Story, context) => (
      <MemoryRouter
        initialEntries={context.parameters.reactRouter?.initialEntries ?? ['/']}
      >
        <Story />
      </MemoryRouter>
    ),
  ],
}

export default preview
